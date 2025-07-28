import { PointTransaction } from '../models/PointTransaction';
import { BaseRepository, IBaseRepository } from './BaseRepository';
import { TransactionType } from '../types';
import { dbConnection } from '../database/connection';

export interface IPointsRepository extends IBaseRepository<PointTransaction> {
  getUserTotal(userId: string): Promise<number>;
  findByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<PointTransaction[]>;
}

interface PointTransactionRow {
  id: string;
  user_id: string;
  assignment_id?: string;
  transaction_type: TransactionType;
  amount: number;
  reason?: string;
  badge_earned?: string;
  leaderboard_position?: number;
  admin_override: number;
  created_at: string;
}

export class PointsRepository extends BaseRepository<PointTransaction> implements IPointsRepository {
  protected tableName = 'point_transactions';

  protected mapToModel(row: unknown): PointTransaction {
    const typedRow = row as PointTransactionRow;
    return {
      id: typedRow.id,
      userId: typedRow.user_id,
      assignmentId: typedRow.assignment_id,
      transactionType: typedRow.transaction_type,
      amount: typedRow.amount,
      reason: typedRow.reason,
      badgeEarned: typedRow.badge_earned,
      leaderboardPosition: typedRow.leaderboard_position,
      adminOverride: !!typedRow.admin_override,
      createdAt: new Date(typedRow.created_at),
    };
  }

  async getUserTotal(userId: string): Promise<number> {
    const sql = `SELECT SUM(amount) as total FROM ${this.tableName} WHERE user_id = ?`;
    const result = await dbConnection.query<{ total: number }>(sql, [userId]);
    return result[0]?.total || 0;
  }

  async findByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<PointTransaction[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE user_id = ?`;
    const params: (string | number)[] = [userId];

    if (startDate) {
      sql += ' AND created_at >= ?';
      params.push(startDate.toISOString());
    }

    if (endDate) {
      sql += ' AND created_at <= ?';
      params.push(endDate.toISOString());
    }

    const rows = await dbConnection.query(sql, params);
    return rows.map(this.mapToModel);
  }
}