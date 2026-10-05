import { addDays, type DayKey, periodEndFor } from '../lib/dates';
import type { Badge, UserBadge } from '../models';
import type { Deps } from './deps';

export class BadgeService {
  constructor(private deps: Deps) {}

  all(): Promise<Badge[]> {
    return this.deps.repos.badges.all();
  }

  earned(userId: string): Promise<UserBadge[]> {
    return this.deps.repos.badges.earned(userId);
  }

  /** Checks the badges a completion can unlock. Returns newly earned ones for celebration. */
  async evaluateAfterCompletion(familyId: string, userId: string, periodStart: DayKey): Promise<Badge[]> {
    const { repos } = this.deps;
    const [badges, earned] = await Promise.all([repos.badges.all(), repos.badges.earned(userId)]);
    const have = new Set(earned.map((e) => e.badgeId));
    const candidates = badges.filter((b) => !have.has(b.id) && b.criteria !== 'weekly_winner');
    if (candidates.length === 0) return [];

    const completions = await repos.assignments.countCompleted(userId);
    const streak = currentStreak(await repos.assignments.completionDays(userId), this.deps.today());
    const perfect = await this.isPerfectWeek(familyId, userId, periodStart);

    const newlyEarned: Badge[] = [];
    // Award bonus-point badges first so point milestones can count those bonuses.
    for (const pass of ['activity', 'points'] as const) {
      const lifetime = pass === 'points' ? await repos.points.lifetimeEarned(userId) : 0;
      for (const b of candidates) {
        const qualifies =
          pass === 'activity'
            ? (b.criteria === 'completions' && completions >= b.threshold) ||
              (b.criteria === 'streak_days' && streak >= b.threshold) ||
              (b.criteria === 'perfect_week' && perfect)
            : b.criteria === 'lifetime_points' && lifetime >= b.threshold;
        if (qualifies) {
          await this.award(familyId, userId, b);
          newlyEarned.push(b);
        }
      }
    }
    return newlyEarned;
  }

  /** Called when a week closes: whoever scored the most that week earns the badge. */
  async awardWeeklyWinner(familyId: string, periodStart: DayKey): Promise<void> {
    const { repos } = this.deps;
    const badge = (await repos.badges.all()).find((b) => b.criteria === 'weekly_winner');
    if (!badge) return;
    const scores = await repos.points.scores(familyId, periodStart, periodEndFor(periodStart));
    const best = Math.max(0, ...Object.values(scores));
    if (best <= 0) return;
    for (const [userId, score] of Object.entries(scores)) {
      if (score !== best) continue;
      const earned = await repos.badges.earned(userId);
      if (!earned.some((e) => e.badgeId === badge.id)) await this.award(familyId, userId, badge);
    }
  }

  private async award(familyId: string, userId: string, badge: Badge): Promise<void> {
    await this.deps.repos.badges.award(userId, badge.id, this.deps.timestamp());
    if (badge.bonusPoints > 0) {
      await this.deps.addPoints(familyId, userId, 'bonus', badge.bonusPoints, `Badge: ${badge.name}`);
    }
  }

  private async isPerfectWeek(familyId: string, userId: string, periodStart: DayKey): Promise<boolean> {
    const mine = (await this.deps.repos.assignments.findByPeriod(familyId, periodStart)).filter(
      (a) => a.userId === userId && a.status !== 'excused',
    );
    return mine.length > 0 && mine.every((a) => a.status === 'completed');
  }
}

/** Consecutive days with a completion, counting back from today (or yesterday, if today is still open). */
export function currentStreak(daysDesc: DayKey[], today: DayKey): number {
  const days = new Set(daysDesc);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
