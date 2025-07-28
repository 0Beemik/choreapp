import { PointTransaction } from '../models/PointTransaction';
import { IPointsRepository, PointsRepository } from '../repositories/PointsRepository';
import { TransactionType, TransactionCategory } from '../types';
import { SQLiteTransaction } from 'expo-sqlite';

type PointMetadata = {
  badgeEarned?: string;
  leaderboardPosition?: number;
  adminOverride?: boolean;
  category?: TransactionCategory;
  note?: string;
};

type AllowancePeriod = { start: Date; end: Date };
type AllowanceCalculation = {
  totalPoints: number;
  allowanceRate: number;
  allowanceAmount: number;
};

export interface IPointsService {
  awardPoints(userId: string, amount: number, reason: string, metadata?: PointMetadata, tx?: SQLiteTransaction): Promise<PointTransaction>;
  deductPoints(userId: string, amount: number, reason: string, metadata?: PointMetadata, tx?: SQLiteTransaction): Promise<PointTransaction>;
  adjustPoints(userId: string, amount: number, reason: string, metadata?: PointMetadata, tx?: SQLiteTransaction): Promise<PointTransaction>;
  getCurrentPoints(userId: string): Promise<number>;
  getPointHistory(userId: string, period?: { start: Date; end: Date }): Promise<PointTransaction[]>;
  transferPoints(fromUserId: string, toUserId: string, amount: number, reason: string): Promise<PointTransaction[]>;
  calculateAllowance(userId: string, period: AllowancePeriod, rate: number): Promise<AllowanceCalculation>;
  getUsersForLeaderboard(familyId: string): Promise<{ id: string }[]>;
}

export class PointsService implements IPointsService {
  constructor(private pointsRepository: IPointsRepository) {}

  async awardPoints(userId: string, amount: number, reason: string, metadata: PointMetadata = {}, tx?: SQLiteTransaction): Promise<PointTransaction> {
    const transaction: Omit<PointTransaction, 'id' | 'createdAt'> = {
      userId,
      amount,
      reason,
      transactionType: TransactionType.EARNED,
      adminOverride: false,
      ...metadata,
    };
    return this.pointsRepository.create(transaction, tx);
  }

  async deductPoints(userId: string, amount: number, reason: string, metadata: PointMetadata = {}, tx?: SQLiteTransaction): Promise<PointTransaction> {
    const transaction: Omit<PointTransaction, 'id' | 'createdAt'> = {
      userId,
      amount: -amount,
      reason,
      transactionType: TransactionType.DEDUCTED,
      adminOverride: false,
      ...metadata,
    };
    return this.pointsRepository.create(transaction, tx);
  }

  async adjustPoints(userId: string, amount: number, reason: string, metadata: PointMetadata = {}, tx?: SQLiteTransaction): Promise<PointTransaction> {
    const transactionType = amount > 0 ? TransactionType.BONUS : TransactionType.PENALTY;
    const transaction: Omit<PointTransaction, 'id' | 'createdAt'> = {
      userId,
      amount,
      reason,
      transactionType,
      adminOverride: true,
      ...metadata,
    };
    return this.pointsRepository.create(transaction, tx);
  }

  async getCurrentPoints(userId: string): Promise<number> {
    return this.pointsRepository.getUserTotal(userId);
  }

  async getPointHistory(userId: string, period?: { start: Date; end: Date }): Promise<PointTransaction[]> {
    return this.pointsRepository.findByUserId(userId, period?.start, period?.end);
  }

  async transferPoints(fromUserId: string, toUserId: string, amount: number, reason: string): Promise<PointTransaction[]> {
    // This should be in a transaction
    const deduction = await this.deductPoints(fromUserId, amount, `Transfer to user ${toUserId}: ${reason}`);
    const award = await this.awardPoints(toUserId, amount, `Transfer from user ${fromUserId}: ${reason}`);
    return [deduction, award];
  }

  async calculateAllowance(userId: string, period: AllowancePeriod, rate: number): Promise<AllowanceCalculation> {
    const history = await this.getPointHistory(userId, period);
    const totalPoints = history
      .filter(t => t.transactionType === 'earned')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const allowanceAmount = totalPoints * rate;

    return {
      totalPoints,
      allowanceRate: rate,
      allowanceAmount,
    };
  }

  async getUsersForLeaderboard(familyId: string): Promise<{ id: string }[]> {
    // This is a placeholder. A real implementation would fetch users
    // and their points from the repository and sort them.
    return Promise.resolve([]);
  }
}
