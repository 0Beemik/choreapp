import type { Db } from '../database';
import { uuid } from '../lib/crypto';
import { dayKey, localTimestamp, type DayKey } from '../lib/dates';
import { AppStateRepository } from '../repositories/AppStateRepository';
import { AssignmentRepository } from '../repositories/AssignmentRepository';
import { BadgeRepository } from '../repositories/BadgeRepository';
import { ChoreRepository } from '../repositories/ChoreRepository';
import { FamilyRepository } from '../repositories/FamilyRepository';
import { PointsRepository } from '../repositories/PointsRepository';
import { UserRepository } from '../repositories/UserRepository';
import { VacationRepository } from '../repositories/VacationRepository';
import type { PointTransaction, TransactionType } from '../models';

export interface Repos {
  families: FamilyRepository;
  users: UserRepository;
  chores: ChoreRepository;
  assignments: AssignmentRepository;
  points: PointsRepository;
  badges: BadgeRepository;
  vacations: VacationRepository;
  appState: AppStateRepository;
}

/** Shared by every service: storage plus an injectable clock so tests can time-travel. */
export class Deps {
  readonly repos: Repos;

  constructor(
    readonly db: Db,
    readonly clock: () => Date = () => new Date(),
  ) {
    this.repos = {
      families: new FamilyRepository(db),
      users: new UserRepository(db),
      chores: new ChoreRepository(db),
      assignments: new AssignmentRepository(db),
      points: new PointsRepository(db),
      badges: new BadgeRepository(db),
      vacations: new VacationRepository(db),
      appState: new AppStateRepository(db),
    };
  }

  today(): DayKey {
    return dayKey(this.clock());
  }

  timestamp(): string {
    return localTimestamp(this.clock());
  }

  async addPoints(
    familyId: string,
    userId: string,
    type: TransactionType,
    amount: number,
    reason: string,
    assignmentId: string | null = null,
  ): Promise<PointTransaction> {
    const t: PointTransaction = {
      id: uuid(),
      familyId,
      userId,
      assignmentId,
      type,
      amount,
      reason,
      createdAt: this.timestamp(),
    };
    await this.repos.points.insert(t);
    return t;
  }
}

export class UserFacingError extends Error {}
