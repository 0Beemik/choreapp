import type { Db } from '../database';
import { uuid } from '../lib/crypto';
import { dayKey, localTimestamp, type DayKey } from '../lib/dates';
import { AppStateRepository } from '../repositories/AppStateRepository';
import { AssignmentRepository } from '../repositories/AssignmentRepository';
import { BadgeRepository } from '../repositories/BadgeRepository';
import { ChoreRepository } from '../repositories/ChoreRepository';
import { CoinsRepository } from '../repositories/CoinsRepository';
import { FamilyRepository } from '../repositories/FamilyRepository';
import { MarketRepository } from '../repositories/MarketRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { PointsRepository } from '../repositories/PointsRepository';
import { UserRepository } from '../repositories/UserRepository';
import { VacationRepository } from '../repositories/VacationRepository';
import type { CoinTransaction, CoinTransactionType, PointTransaction, TransactionType } from '../models';

export interface Repos {
  families: FamilyRepository;
  users: UserRepository;
  chores: ChoreRepository;
  assignments: AssignmentRepository;
  points: PointsRepository;
  coins: CoinsRepository;
  market: MarketRepository;
  notifications: NotificationRepository;
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
      coins: new CoinsRepository(db),
      market: new MarketRepository(db),
      notifications: new NotificationRepository(db),
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

  /** Every coin movement goes through here, so balances and history always agree. */
  async addCoins(
    familyId: string,
    userId: string,
    type: CoinTransactionType,
    amount: number,
    reason: string,
    link: { assignmentId?: string | null; refId?: string | null } = {},
  ): Promise<CoinTransaction> {
    const t: CoinTransaction = {
      id: uuid(),
      familyId,
      userId,
      assignmentId: link.assignmentId ?? null,
      refId: link.refId ?? null,
      type,
      amount,
      reason,
      createdAt: this.timestamp(),
    };
    await this.repos.coins.insert(t);
    return t;
  }
}

export class UserFacingError extends Error {}
