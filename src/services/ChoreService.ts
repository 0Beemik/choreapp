import { uuid } from '../lib/crypto';
import { monthBounds } from '../lib/dates';
import type { Badge, Chore, ChoreAssignment, ChoreFrequency, Family } from '../models';
import type { BadgeService } from './BadgeService';
import { UserFacingError, type Deps } from './deps';
import type { RotationService } from './RotationService';

export interface ChoreInput {
  name: string;
  icon: string;
  frequency: ChoreFrequency;
  points: number | null;
  fixedUserId: string | null;
}

export interface CompletionResult {
  pointsAwarded: number;
  newBadges: Badge[];
}

export interface BuyoutQuote {
  cost: number;
  balance: number;
  buyoutsLeftThisMonth: number;
  allowed: boolean;
  reason: string | null;
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
    const name = input.name.trim();
    if (!name) throw new UserFacingError('Give the chore a name.');
    const chore: Chore = {
      id: uuid(),
      familyId,
      name,
      icon: input.icon,
      frequency: input.frequency,
      points: input.points,
      fixedUserId: input.fixedUserId,
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
    const name = input.name.trim();
    if (!name) throw new UserFacingError('Give the chore a name.');
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

  async complete(assignmentId: string): Promise<CompletionResult> {
    const { repos } = this.deps;
    const { assignment, chore, family } = await this.load(assignmentId);
    if (assignment.status !== 'pending') throw new UserFacingError('This chore is already taken care of.');
    if (assignment.dueDate < this.deps.today()) throw new UserFacingError('This chore is past its day.');

    const points = chorePoints(chore, family);
    return this.deps.db.transaction(async () => {
      await repos.assignments.setStatus(assignment.id, 'completed', {
        completedAt: this.deps.timestamp(),
        pointsAwarded: points,
      });
      await this.deps.addPoints(family.id, assignment.userId, 'earned', points, chore.name, assignment.id);
      const newBadges = await this.badges.evaluateAfterCompletion(
        family.id,
        assignment.userId,
        assignment.periodStart,
      );
      return { pointsAwarded: points, newBadges };
    });
  }

  /** Kids tap the wrong thing. Undo takes the points back; badges already earned stay. */
  async undo(assignmentId: string): Promise<void> {
    const { repos } = this.deps;
    const { assignment } = await this.load(assignmentId);
    if (assignment.status !== 'completed' && assignment.status !== 'bought_out') return;
    if (assignment.dueDate < this.deps.today()) throw new UserFacingError('That day is already closed.');
    await this.deps.db.transaction(async () => {
      for (const t of await repos.points.findForAssignment(assignment.id)) {
        if (t.type === 'earned' || t.type === 'spent') await repos.points.delete(t.id);
      }
      await repos.assignments.setStatus(assignment.id, 'pending');
    });
  }

  async buyoutQuote(assignmentId: string): Promise<BuyoutQuote> {
    const { repos } = this.deps;
    const { assignment, chore, family } = await this.load(assignmentId);
    const cost = Math.max(1, Math.ceil((chorePoints(chore, family) * family.settings.buyoutCostPercentage) / 100));
    const balance = await repos.points.balance(assignment.userId);
    const month = monthBounds(this.deps.today());
    const used = await repos.assignments.countBuyouts(assignment.userId, month.start, month.end);
    const buyoutsLeftThisMonth = Math.max(0, family.settings.maxBuyoutsPerMonth - used);

    let reason: string | null = null;
    if (assignment.status !== 'pending') reason = 'This chore is already taken care of.';
    else if (buyoutsLeftThisMonth === 0) reason = 'No skips left this month.';
    else if (balance < cost) reason = `You need ${cost - balance} more points.`;
    return { cost, balance, buyoutsLeftThisMonth, allowed: reason === null, reason };
  }

  async buyout(assignmentId: string): Promise<void> {
    const quote = await this.buyoutQuote(assignmentId);
    if (!quote.allowed) throw new UserFacingError(quote.reason ?? 'Cannot skip this chore.');
    const { assignment, chore, family } = await this.load(assignmentId);
    await this.deps.db.transaction(async () => {
      await this.deps.repos.assignments.setStatus(assignment.id, 'bought_out', { pointsSpent: quote.cost });
      await this.deps.addPoints(family.id, assignment.userId, 'spent', -quote.cost, `Skipped: ${chore.name}`, assignment.id);
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
    await this.deps.repos.assignments.reassign(assignmentId, userId);
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
