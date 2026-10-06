import { sha256, uuid } from '../lib/crypto';
import { AVATAR_COLORS, AVATAR_EMOJIS, type ChorePreset } from '../lib/presets';
import type { Family, FamilySettings, Role, User } from '../models';
import type { ChoreService } from './ChoreService';
import { UserFacingError, type Deps } from './deps';
import type { RotationService } from './RotationService';

export const DEFAULT_SETTINGS: FamilySettings = {
  pointsPerChore: 10,
  buyoutCostPercentage: 100,
  maxBuyoutsPerMonth: 4,
  rotationDay: 'sunday',
  missedChorePenalty: 2,
};

export interface MemberInput {
  name: string;
  age: number;
  role: Role;
  avatarEmoji?: string;
  avatarColor?: string;
  allowanceRate?: number;
}

export interface SetupInput {
  familyName: string;
  parent: MemberInput;
  pin: string;
  kids: MemberInput[];
  chores: ChorePreset[];
}

export const isValidPin = (pin: string) => /^\d{4}$/.test(pin);

export class FamilyService {
  constructor(
    private deps: Deps,
    private rotation: RotationService,
    private chores: ChoreService,
  ) {}

  current(): Promise<Family | null> {
    return this.deps.repos.families.first();
  }

  members(familyId: string): Promise<User[]> {
    return this.deps.repos.users.findByFamily(familyId);
  }

  async setup(input: SetupInput): Promise<Family> {
    const familyName = input.familyName.trim();
    if (familyName.length < 2) throw new UserFacingError('Family name needs at least 2 characters.');
    if (!isValidPin(input.pin)) throw new UserFacingError('The PIN must be 4 digits.');
    if (input.kids.length === 0) throw new UserFacingError('Add at least one kid.');

    const family: Family = {
      id: uuid(),
      name: familyName,
      settings: { ...DEFAULT_SETTINGS },
      currentPeriodStart: null,
      createdAt: this.deps.timestamp(),
    };

    await this.deps.db.transaction(async () => {
      await this.deps.repos.families.insert(family, await hashPin(input.pin));
      await this.addMember(family.id, { ...input.parent, role: 'parent' });
      for (const kid of input.kids) await this.addMember(family.id, { ...kid, role: 'child' });
      for (const c of input.chores) {
        await this.chores.add(family.id, { ...c, points: null, assigneeIds: [], timeOfDay: c.timeOfDay ?? 'any' });
      }
      await this.rotation.ensureCurrentPeriod(family.id);
    });
    return family;
  }

  async verifyPin(familyId: string, pin: string): Promise<boolean> {
    const stored = await this.deps.repos.families.getPin(familyId);
    if (!stored) return false;
    return (await sha256(`${stored.salt}:${pin}`)) === stored.hash;
  }

  async changePin(familyId: string, pin: string): Promise<void> {
    if (!isValidPin(pin)) throw new UserFacingError('The PIN must be 4 digits.');
    await this.deps.repos.families.setPin(familyId, await hashPin(pin));
  }

  async rename(familyId: string, name: string): Promise<void> {
    if (name.trim().length < 2) throw new UserFacingError('Family name needs at least 2 characters.');
    await this.deps.repos.families.updateName(familyId, name.trim());
  }

  async updateSettings(familyId: string, settings: FamilySettings): Promise<void> {
    validateSettings(settings);
    const family = await this.deps.repos.families.findById(familyId);
    if (!family) return;
    await this.deps.db.transaction(async () => {
      await this.deps.repos.families.updateSettings(familyId, settings);
      if (settings.rotationDay !== family.settings.rotationDay) {
        // The week boundary moved: drop untouched future chores and deal the new week.
        await this.deps.repos.assignments.deletePendingFrom(familyId, this.deps.today());
        await this.deps.repos.families.setCurrentPeriod(familyId, null);
        await this.rotation.ensureCurrentPeriod(familyId);
      }
    });
  }

  async addMember(familyId: string, input: MemberInput): Promise<User> {
    const existing = await this.deps.repos.users.findByFamily(familyId);
    const user: User = {
      id: uuid(),
      familyId,
      ...validateMember(input),
      avatarEmoji: input.avatarEmoji ?? AVATAR_EMOJIS[existing.length % AVATAR_EMOJIS.length],
      avatarColor: input.avatarColor ?? AVATAR_COLORS[existing.length % AVATAR_COLORS.length],
      allowanceRate: input.allowanceRate ?? 0,
      createdAt: this.deps.timestamp(),
    };
    await this.deps.repos.users.insert(user);
    return user;
  }

  async addKidAndReshuffle(familyId: string, input: MemberInput): Promise<User> {
    const user = await this.addMember(familyId, { ...input, role: 'child' });
    await this.rotation.reshuffleCurrentPeriod(familyId);
    return user;
  }

  async updateMember(user: User): Promise<void> {
    const before = await this.deps.repos.users.findById(user.id);
    await this.deps.repos.users.update({ ...user, ...validateMember(user) });
    if (before && before.role !== user.role) await this.rotation.reshuffleCurrentPeriod(user.familyId);
  }

  async removeMember(user: User): Promise<void> {
    const members = await this.members(user.familyId);
    if (user.role === 'parent' && members.filter((m) => m.role === 'parent').length <= 1) {
      throw new UserFacingError('A family needs at least one parent.');
    }
    await this.deps.db.transaction(async () => {
      await this.deps.repos.users.delete(user.id);
      await this.rotation.reshuffleCurrentPeriod(user.familyId);
    });
  }

  /** Wipes everything on this device so the setup wizard runs again. */
  async resetEverything(): Promise<void> {
    await this.deps.repos.families.deleteAll();
  }
}

async function hashPin(pin: string): Promise<{ hash: string; salt: string }> {
  const salt = uuid();
  return { salt, hash: await sha256(`${salt}:${pin}`) };
}

function validateMember(input: MemberInput): Pick<User, 'name' | 'age' | 'role'> {
  const name = input.name.trim();
  if (!name) throw new UserFacingError('Every family member needs a name.');
  // Age drives the kid-friendly layout; parents' age is never used, so 0 means "not asked".
  const ageOk = input.role === 'parent' ? input.age === 0 || (input.age >= 1 && input.age <= 120) : input.age >= 1 && input.age <= 25;
  if (!Number.isInteger(input.age) || !ageOk) {
    throw new UserFacingError(`Please enter a real age for ${name}.`);
  }
  return { name, age: input.age, role: input.role };
}

function validateSettings(s: FamilySettings): void {
  const whole = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
  if (!whole(s.pointsPerChore, 1, 1000)) throw new UserFacingError('Points per chore must be 1–1000.');
  if (!whole(s.buyoutCostPercentage, 0, 1000)) throw new UserFacingError('Skip cost must be 0–1000%.');
  if (!whole(s.maxBuyoutsPerMonth, 0, 100)) throw new UserFacingError('Skips per month must be 0–100.');
  if (!whole(s.missedChorePenalty, 0, 1000)) throw new UserFacingError('Missed-chore penalty must be 0–1000.');
}
