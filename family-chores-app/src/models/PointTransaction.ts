import { TransactionType, TransactionCategory } from '../types';

export interface PointTransaction {
  id: string;
  userId: string;
  assignmentId?: string;
  transactionType: TransactionType;
  amount: number;
  reason: string;
  badgeEarned?: string;
  leaderboardPosition?: number;
  adminOverride: boolean;
  category?: TransactionCategory;
  note?: string;
  createdAt: Date;
}
