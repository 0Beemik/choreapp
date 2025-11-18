import { dbConnection } from '../database/connection';
import { UserBadge } from '../models/UserBadge';
import { BaseRepository, IBaseRepository } from './BaseRepository';

export interface IUserBadgeRepository extends IBaseRepository<UserBadge> {
  findByUserIdAndPeriod(userId: string, startDate: Date, endDate: Date): Promise<UserBadge[]>;
}

interface UserBadgeRow {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export class UserBadgeRepository extends BaseRepository<UserBadge> implements IUserBadgeRepository {
  protected tableName = 'user_badges';

  protected mapToModel(row: unknown): UserBadge {
    const typedRow = row as UserBadgeRow;
    return {
      id: typedRow.id,
      userId: typedRow.user_id,
      badgeId: typedRow.badge_id,
      earnedAt: new Date(typedRow.earned_at),
    };
  }

  async findByUserIdAndPeriod(userId: string, startDate: Date, endDate: Date): Promise<UserBadge[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND earned_at BETWEEN ? AND ?;`;
    const result = await dbConnection.query<UserBadgeRow>(sql, [userId, startDate.toISOString(), endDate.toISOString()]);
    return result.map(row => this.mapToModel(row));
  }
}
