import { uuid } from '../lib/crypto';
import { dayKey, localTimestamp, monthBounds } from '../lib/dates';
import type { Badge, Chore, ChoreAssignment, ChoreFrequency, Family, TimeOfDay } from '../models';
import type { BadgeService } from './BadgeService';
import { UserFacingError, type Deps } from './deps';
import type { RotationService } from './RotationService';

export interface ChoreInput {
  name: string;
  icon: string;
  frequency: ChoreFrequency;
  points: number | null;
  /** Empty = rotates weekly. */
  assigneeIds: string[];
  timeOfDay: TimeOfDay;
  /** 2, or 3 with a parent's bonus coin. */
  coins: number;
}

export interface CompletionResult {
  pointsAwarded: number;
  coinsAwarded: number;
  newBadges: Badge[];
}

/** Skips are free "get out of jail" cards: no points, no coins, no penalty, limited per month. */
export interface BuyoutQuote {
  buyoutsLeftThisMonth: number;
  allowed: boolean;
  reason: string | null;
}

export const MIN_CHORE_COINS = 2;
export const MAX_CHORE_COINS = 3;

function checkChoreInput(input: ChoreInput): string {
  const name = input.name.trim();
  if (!name) throw new UserFacingError('Give the chore a name.');
  if (!Number.isInteger(input.coins) || input.coins < MIN_CHORE_COINS || input.coins > MAX_CHORE_COINS) {
    throw new UserFacingError(`A chore pays ${MIN_CHORE_COINS} or ${MAX_CHORE_COINS} coins.`);
  }
  return name;
}

export function chorePoints(chore: Pick<Chore, 'points'>, family: Family): number {
  return chore.points ?? family.settings.pointsPerChore;
}

export class ChoreService {
  constructor(
    private deps: Deps,
    private rotation: RotationService,
    private badges: BadgeService,
  ) {}

  list(familyId: string): Promise<Chore[]> {
    return this.deps.repos.chores.findActive(familyId);
  }

  async add(familyId: string, input: ChoreInput): Promise<Chore> {
    const name = checkChoreInput(input);
    const chore: Chore = {
      id: uuid(),
      familyId,
      name,
      icon: input.icon,
      frequency: input.frequency,
      points: input.points,
      assigneeIds: input.assigneeIds,
      timeOfDay: input.timeOfDay,
      coins: input.coins,
      rotationOffset: await this.deps.repos.chores.nextRotationOffset(familyId),
      isActive: true,
      createdAt: this.deps.timestamp(),
    };
    await this.deps.db.transaction(async () => {
      await this.deps.repos.chores.insert(chore);
      await this.rotation.assignChoreNow(familyId, chore);
    });
    return chore;
  }

  async update(choreId: string, input: ChoreInput): Promise<void> {
    const { repos } = this.deps;
    const existing = await repos.chores.findById(choreId);
    if (!existing) throw new UserFacingError('That chore no longer exists.');
    const name = checkChoreInput(input);
    const updated: Chore = { ...existing, ...input, name };
    await this.deps.db.transaction(async () => {
      await repos.chores.update(updated);
      // Re-deal anything not yet done so new frequency/assignee takes effect today.
      await repos.assignments.deletePendingForChore(choreId, this.deps.today());
      await this.rotation.assignChoreNow(existing.familyId, updated);
    });
  }

  async remove(choreId: string): Promise<void> {
    const { repos } = this.deps;
    const existing = await repos.chores.findById(choreId);
    if (!existing) return;
    await this.deps.db.transaction(async () => {
      await repos.chores.update({ ...existing, isActive: false });
      await repos.assignments.deletePendingForChore(choreId, this.deps.today());
    });
  }

  /**
   * `at` is when the kid actually tapped it. Joined devices sync later, so a chore done on
   * time still counts even if the hub has since marked it missed.
   */
  async complete(assignmentId: string, at?: Date): Promise<CompletionResult> {
    const { repos } = this.deps;
    const { assignment, chore, family } = await this.load(assignmentId);
    const when = this.actionTime(at);
    return this.deps.db.transaction(async () => {
      await this.reopenIfDoneInTime(assignment, when);
      if (assignment.status !== 'pending' && assignment.status !== 'missed') {
        throw new UserFacingError('This chore is already taken care of.');
      }
      if (assignment.dueDate < dayKey(when)) throw new UserFacingError('This chore is past its day.');

      const points = chorePoints(chore, family);
      await repos.assignments.setStatus(assignment.id, 'completed', {
        completedAt: localTimestamp(when),
        pointsAwarded: points,
      });
      await this.deps.addPoints(family.id, assignment.userId, 'earned', points, chore.name, assignment.id);
      await this.deps.addCoins(family.id, assignment.userId, 'earned', chore.coins, chore.name, { assignmentId: assignment.id });
      await this.tellParents(family.id, assignment, chore, points);
      const newBadges = await this.badges.evaluateAfterCompletion(
        family.id,
        assignment.userId,
        assignment.periodStart,
      );
      return { pointsAwarded: points, coinsAwarded: chore.coins, newBadges };
    });
  }

  /** Kids tap the wrong thing. Undo takes the points and coins back; badges already earned stay. */
  async undo(assignmentId: string): Promise<void> {
    const { repos } = this.deps;
    const { assignment } = await this.load(assignmentId);
    if (assignment.status !== 'completed' && assignment.status !== 'bought_out') return;
    if (assignment.dueDate < this.deps.today()) throw new UserFacingError('That day is already closed.');
    await this.deps.db.transaction(async () => {
      for (const t of await repos.points.findForAssignment(assignment.id)) {
        if (t.type === 'earned' || t.type === 'spent') await repos.points.delete(t.id);
      }
      for (const t of await repos.coins.findForAssignment(assignment.id)) {
        if (t.type === 'earned') await repos.coins.delete(t.id);
      }
      await repos.notifications.deleteByRef('chore_done', choreDoneRef(assignment));
      await repos.assignments.setStatus(assignment.id, 'pending');
    });
  }

  async buyoutQuote(assignmentId: string, at?: Date): Promise<BuyoutQuote> {
    const { repos } = this.deps;
    const { assignment, family } = await this.load(assignmentId);
    const inTime = assignment.status === 'missed' && dayKey(this.actionTime(at)) <= assignment.dueDate;
    const month = monthBounds(this.deps.today());
    const used = await repos.assignments.countBuyouts(assignment.userId, month.start, month.end);
    const buyoutsLeftThisMonth = Math.max(0, family.settings.maxBuyoutsPerMonth - used);

    let reason: string | null = null;
    if (assignment.status !== 'pending' && !inTime) reason = 'This chore is already taken care of.';
    else if (buyoutsLeftThisMonth === 0) reason = 'No skips left this month.';
    return { buyoutsLeftThisMonth, allowed: reason === null, reason };
  }

  /** Free, but uses up one of the month's skips. A missed-chore penalty is lifted if still in time. */
  async buyout(assignmentId: string, at?: Date): Promise<void> {
    const quote = await this.buyoutQuote(assignmentId, at);
    if (!quote.allowed) throw new UserFacingError(quote.reason ?? 'Cannot skip this chore.');
    const { assignment } = await this.load(assignmentId);
    await this.deps.db.transaction(async () => {
      await this.reopenIfDoneInTime(assignment, this.actionTime(at));
      await this.deps.repos.assignments.setStatus(assignment.id, 'bought_out');
    });
  }

  /** Parent override: sick day, special occasion. No points either way. */
  async excuse(assignmentId: string): Promise<void> {
    const { assignment } = await this.load(assignmentId);
    if (assignment.status === 'completed' || assignment.status === 'bought_out') await this.undo(assignmentId);
    await this.deps.repos.assignments.setStatus(assignmentId, 'excused');
  }

  async reassign(assignmentId: string, userId: string): Promise<void> {
    const { assignment } = await this.load(assignmentId);
    if (assignment.status !== 'pending') throw new UserFacingError('Only chores not yet done can be moved.');
    if (await this.deps.repos.assignments.hasChoreOnDay(userId, assignment.choreId, assignment.dueDate)) {
      throw new UserFacingError('They already have this chore that day.');
    }
    await this.deps.repos.assignments.reassign(assignmentId, userId);
  }

  /** Parents (except whoever did it) hear about every finished chore; kids don't hear about each other's. */
  private async tellParents(familyId: string, assignment: ChoreAssignment, chore: Chore, points: number): Promise<void> {
    const { repos } = this.deps;
    const members = await repos.users.findByFamily(familyId);
    const doer = members.find((m) => m.id === assignment.userId);
    for (const parent of members.filter((m) => m.role === 'parent' && m.id !== assignment.userId)) {
      await repos.notifications.insert({
        id: uuid(),
        familyId,
        userId: parent.id,
        kind: 'chore_done',
        text: `✅ ${doer?.name ?? 'Someone'} finished “${chore.name}” · +${points} ⭐ +${chore.coins} 🪙`,
        refId: choreDoneRef(assignment),
        createdAt: this.deps.timestamp(),
      });
    }
  }

  /** Clamp device clocks: an action can't be from the future. */
  private actionTime(at?: Date): Date {
    const now = this.deps.clock();
    return at && at < now ? at : now;
  }

  /** The hub closed this as missed, but the kid did it on time on their own device. */
  private async reopenIfDoneInTime(assignment: ChoreAssignment, when: Date): Promise<void> {
    if (assignment.status !== 'missed' || dayKey(when) > assignment.dueDate) return;
    for (const t of await this.deps.repos.points.findForAssignment(assignment.id)) {
      if (t.type === 'penalty') await this.deps.repos.points.delete(t.id);
    }
    await this.deps.repos.assignments.setStatus(assignment.id, 'pending');
    assignment.status = 'pending';
  }

  private async load(assignmentId: string): Promise<{ assignment: ChoreAssignment; chore: Chore; family: Family }> {
    const { repos } = this.deps;
    const assignment = await repos.assignments.findById(assignmentId);
    if (!assignment) throw new UserFacingError('That chore no longer exists.');
    const [chore, family] = await Promise.all([
      repos.chores.findById(assignment.choreId),
      repos.families.findById(assignment.familyId),
    ]);
    if (!chore || !family) throw new UserFacingError('That chore no longer exists.');
    return { assignment, chore, family };
  }
}

function choreDoneRef(a: Pick<ChoreAssignment, 'id' | 'userId'>): string {
  return `${a.userId}|${a.id}`;
}
