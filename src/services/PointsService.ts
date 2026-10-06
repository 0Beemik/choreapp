import { uuid } from '../lib/crypto';
import { addDays, monthBounds, periodEndFor, periodStartFor, type DayKey } from '../lib/dates';
import { TIMES_OF_DAY, type ChoreAssignment, type LeaderboardRow, type PointTransaction, type Vacation } from '../models';
import { UserFacingError, type Deps } from './deps';

export type LeaderboardRange = 'week' | 'month' | 'all';

export interface AllowanceSummary {
  periodStart: DayKey;
  done: number;
  total: number;
  /** Dollars earned so far this week at the kid's allowance rate. */
  amount: number;
}

export class PointsService {
  constructor(private deps: Deps) {}

  balances(familyId: string): Promise<Record<string, number>> {
    return this.deps.repos.points.balances(familyId);
  }

  history(userId: string): Promise<PointTransaction[]> {
    return this.deps.repos.points.history(userId);
  }

  async adjust(familyId: string, userId: string, amount: number, reason: string): Promise<void> {
    if (!Number.isInteger(amount) || amount === 0) throw new UserFacingError('Enter a whole number of points.');
    const text = reason.trim() || (amount > 0 ? 'Bonus from parent' : 'Adjustment by parent');
    await this.deps.addPoints(familyId, userId, amount > 0 ? 'bonus' : 'adjustment', amount, text);
  }

  async leaderboard(familyId: string, range: LeaderboardRange): Promise<LeaderboardRow[]> {
    const { repos } = this.deps;
    const family = await repos.families.findById(familyId);
    if (!family) return [];
    const today = this.deps.today();
    const from =
      range === 'week'
        ? periodStartFor(today, family.settings.rotationDay)
        : range === 'month'
          ? monthBounds(today).start
          : null;

    const [kids, scores] = await Promise.all([
      repos.users.findByFamily(familyId).then((us) => us.filter((u) => u.role === 'child')),
      repos.points.scores(familyId, from, today),
    ]);
    const completed = await this.completedCounts(familyId, from, today);

    const rows = kids
      .map((user) => ({ user, points: scores[user.id] ?? 0, completed: completed[user.id] ?? 0, rank: 0 }))
      .sort((a, b) => b.points - a.points || b.completed - a.completed);
    rows.forEach((r, i) => {
      // Ties share a rank so siblings with equal points both see "1st".
      r.rank = i > 0 && r.points === rows[i - 1].points ? rows[i - 1].rank : i + 1;
    });
    return rows;
  }

  async allowance(familyId: string, userId: string): Promise<AllowanceSummary> {
    const { repos } = this.deps;
    const family = await repos.families.findById(familyId);
    const user = await repos.users.findById(userId);
    const periodStart = periodStartFor(this.deps.today(), family?.settings.rotationDay ?? 'sunday');
    const mine = (await repos.assignments.findByPeriod(familyId, periodStart)).filter(
      (a) => a.userId === userId && a.status !== 'excused',
    );
    const done = mine.filter((a) => a.status === 'completed').length;
    const total = mine.length;
    const amount = total === 0 ? 0 : Math.round(((user?.allowanceRate ?? 0) * done * 100) / total) / 100;
    return { periodStart, done, total, amount };
  }

  private async completedCounts(familyId: string, from: DayKey | null, to: DayKey): Promise<Record<string, number>> {
    const rows = await this.deps.db.all<{ user_id: string; n: number }>(
      `SELECT user_id, COUNT(*) AS n FROM chore_assignments
       WHERE family_id = ? AND status = 'completed'
         AND substr(completed_at, 1, 10) >= ? AND substr(completed_at, 1, 10) <= ?
       GROUP BY user_id`,
      [familyId, from ?? '0000-00-00', to],
    );
    return Object.fromEntries(rows.map((r) => [r.user_id, r.n]));
  }
}

export interface Board {
  periodStart: DayKey;
  periodEnd: DayKey;
  today: DayKey;
  vacation: Vacation | null;
  /** What each kid should see now: today's daily chores plus this week's weekly chores,
   * in board order (morning → afternoon → evening → all day, to-do before done). */
  byUser: Record<string, ChoreAssignment[]>;
}

export class BoardService {
  constructor(private deps: Deps) {}

  async load(familyId: string): Promise<Board | null> {
    const { repos } = this.deps;
    const family = await repos.families.findById(familyId);
    if (!family) return null;
    const today = this.deps.today();
    const periodStart = periodStartFor(today, family.settings.rotationDay);
    const [assignments, chores, vacations] = await Promise.all([
      repos.assignments.findByPeriod(familyId, periodStart),
      repos.chores.findActive(familyId),
      repos.vacations.overlapping(familyId, today, today),
    ]);
    const weekly = new Set(chores.filter((c) => c.frequency === 'weekly').map((c) => c.id));
    const byUser: Record<string, ChoreAssignment[]> = {};
    for (const a of assignments) {
      const visible = a.dueDate === today || (weekly.has(a.choreId) && a.dueDate >= today);
      if (!visible || a.status === 'excused') continue;
      (byUser[a.userId] ??= []).push(a);
    }
    const slot = new Map(chores.map((c) => [c.id, TIMES_OF_DAY.indexOf(c.timeOfDay)]));
    for (const list of Object.values(byUser)) {
      list.sort(
        (x, y) =>
          (slot.get(x.choreId) ?? 0) - (slot.get(y.choreId) ?? 0) ||
          Number(x.status !== 'pending') - Number(y.status !== 'pending'),
      );
    }
    return { periodStart, periodEnd: periodEndFor(periodStart), today, vacation: vacations[0] ?? null, byUser };
  }
}

export class VacationService {
  constructor(private deps: Deps) {}

  upcoming(familyId: string): Promise<Vacation[]> {
    return this.deps.repos.vacations.upcoming(familyId, this.deps.today());
  }

  async add(familyId: string, startDate: DayKey, days: number): Promise<void> {
    if (!Number.isInteger(days) || days < 1 || days > 90) throw new UserFacingError('Pick 1 to 90 days.');
    const endDate = addDays(startDate, days - 1);
    const { repos } = this.deps;
    await this.deps.db.transaction(async () => {
      await repos.vacations.insert({ id: uuid(), familyId, startDate, endDate });
      // Chores already handed out for vacation days are excused immediately.
      const today = this.deps.today();
      const family = await repos.families.findById(familyId);
      const periodStart = periodStartFor(today, family?.settings.rotationDay ?? 'sunday');
      for (const a of await repos.assignments.findByPeriod(familyId, periodStart)) {
        if (a.status === 'pending' && a.dueDate >= startDate && a.dueDate <= endDate) {
          await repos.assignments.setStatus(a.id, 'excused');
        }
      }
    });
  }

  remove(id: string): Promise<void> {
    return this.deps.repos.vacations.delete(id);
  }
}
