import { uuid } from '../lib/crypto';
import {
  addDays,
  daysInRange,
  periodEndFor,
  periodStartFor,
  weekIndex,
  type DayKey,
} from '../lib/dates';
import type { Chore, Family, User, Vacation } from '../models';
import type { BadgeService } from './BadgeService';
import type { Deps } from './deps';

/**
 * Owns the weekly chore cycle: closes out finished days/weeks (missed chores cost points
 * unless the family was on vacation) and hands out the current week's chores, rotating
 * them between kids each week.
 */
export class RotationService {
  constructor(
    private deps: Deps,
    private badges: BadgeService,
  ) {}

  /** Idempotent; safe to call on every app open or screen focus. */
  async ensureCurrentPeriod(familyId: string): Promise<void> {
    const { repos } = this.deps;
    const family = await repos.families.findById(familyId);
    if (!family) return;
    const today = this.deps.today();
    const periodStart = periodStartFor(today, family.settings.rotationDay);

    await this.deps.db.transaction(async () => {
      await this.closeOutPastDue(family, today);

      if (family.currentPeriodStart !== periodStart) {
        if (family.currentPeriodStart && family.currentPeriodStart < periodStart) {
          await this.badges.awardWeeklyWinner(family.id, family.currentPeriodStart);
        }
        await this.assignPeriod(family, periodStart, today);
        await repos.families.setCurrentPeriod(family.id, periodStart);
      }
    });
  }

  /** Re-deal the rest of the current week, e.g. after kids or chores change. */
  async reshuffleCurrentPeriod(familyId: string): Promise<void> {
    const { repos } = this.deps;
    const family = await repos.families.findById(familyId);
    if (!family) return;
    const today = this.deps.today();
    const periodStart = periodStartFor(today, family.settings.rotationDay);
    await this.deps.db.transaction(async () => {
      await repos.assignments.deletePendingForPeriod(family.id, periodStart, today);
      await this.assignPeriod(family, periodStart, today);
      await repos.families.setCurrentPeriod(family.id, periodStart);
    });
  }

  /** Hand out one chore for the remainder of the current week. */
  async assignChoreNow(familyId: string, chore: Chore): Promise<void> {
    const family = await this.deps.repos.families.findById(familyId);
    if (!family) return;
    const today = this.deps.today();
    const periodStart = periodStartFor(today, family.settings.rotationDay);
    const members = await this.deps.repos.users.findByFamily(familyId);
    const vacations = await this.deps.repos.vacations.overlapping(familyId, today, periodEndFor(periodStart));
    await this.assignChore(family, chore, members, vacations, periodStart, today);
  }

  private async assignPeriod(family: Family, periodStart: DayKey, fromDay: DayKey): Promise<void> {
    const { repos } = this.deps;
    const [chores, members, vacations] = await Promise.all([
      repos.chores.findActive(family.id),
      repos.users.findByFamily(family.id),
      repos.vacations.overlapping(family.id, fromDay, periodEndFor(periodStart)),
    ]);
    for (const chore of chores) {
      await this.assignChore(family, chore, members, vacations, periodStart, fromDay);
    }
  }

  private async assignChore(
    family: Family,
    chore: Chore,
    members: User[],
    vacations: Vacation[],
    periodStart: DayKey,
    fromDay: DayKey,
  ): Promise<void> {
    const assignee = pickAssignee(chore, members, periodStart);
    if (!assignee) return;

    const periodEnd = periodEndFor(periodStart);
    const start = fromDay > periodStart ? fromDay : periodStart;
    const workDays = daysInRange(start, periodEnd).filter((d) => !onVacation(d, vacations));
    if (workDays.length === 0) return;

    const dueDates = chore.frequency === 'daily' ? workDays : [periodEnd];
    for (const dueDate of dueDates) {
      await this.deps.repos.assignments.insert({
        id: uuid(),
        familyId: family.id,
        choreId: chore.id,
        userId: assignee.id,
        periodStart,
        dueDate,
        status: 'pending',
        completedAt: null,
        pointsAwarded: 0,
        pointsSpent: 0,
        createdAt: this.deps.timestamp(),
      });
    }
  }

  private async closeOutPastDue(family: Family, today: DayKey): Promise<void> {
    const { repos } = this.deps;
    const overdue = await repos.assignments.findPendingDueBefore(family.id, today);
    if (overdue.length === 0) return;

    const earliest = overdue.reduce((m, a) => (a.dueDate < m ? a.dueDate : m), today);
    const vacations = await repos.vacations.overlapping(family.id, earliest, addDays(today, -1));
    const penalty = family.settings.missedChorePenalty;

    for (const a of overdue) {
      if (onVacation(a.dueDate, vacations)) {
        await repos.assignments.setStatus(a.id, 'excused');
        continue;
      }
      await repos.assignments.setStatus(a.id, 'missed', { pointsSpent: penalty });
      if (penalty > 0) {
        const chore = await repos.chores.findById(a.choreId);
        await this.deps.addPoints(family.id, a.userId, 'penalty', -penalty, `Missed: ${chore?.name ?? 'chore'}`, a.id);
      }
    }
  }
}

export function pickAssignee(chore: Chore, members: User[], periodStart: DayKey): User | null {
  if (chore.fixedUserId) {
    return members.find((m) => m.id === chore.fixedUserId) ?? null;
  }
  const kids = members.filter((m) => m.role === 'child');
  const pool = kids.length > 0 ? kids : members;
  if (pool.length === 0) return null;
  return pool[(weekIndex(periodStart) + chore.rotationOffset) % pool.length];
}

function onVacation(day: DayKey, vacations: Vacation[]): boolean {
  return vacations.some((v) => v.startDate <= day && day <= v.endDate);
}
