import { AchievementProgress } from '../models/Achievement';
import { BaseRepository, IBaseRepository } from './BaseRepository';
import { dbConnection } from '../database/connection';

export interface IAchievementRepository extends IBaseRepository<AchievementProgress> {
  findByUserIdAndBadgeId(userId: string, badgeId: string): Promise<AchievementProgress | null>;
  findByUserId(userId: string): Promise<AchievementProgress[]>;
}

interface AchievementProgressRow {
  id: string;
  user_id: string;
  badge_id: string;
  current_progress: number;
  required_progress: number;
  progress_percentage: number;
  estimated_completion?: string;
  last_updated: string;
}

export class AchievementRepository extends BaseRepository<AchievementProgress> implements IAchievementRepository {
  protected tableName = 'achievement_progress';

  protected mapToModel(row: unknown): AchievementProgress {
    const typedRow = row as AchievementProgressRow;
    return {
      id: typedRow.id,
      userId: typedRow.user_id,
      badgeId: typedRow.badge_id,
      currentProgress: typedRow.current_progress,
      requiredProgress: typedRow.required_progress,
      progressPercentage: typedRow.progress_percentage,
      estimatedCompletion: typedRow.estimated_completion ? new Date(typedRow.estimated_completion) : undefined,
      lastUpdated: new Date(typedRow.last_updated),
    };
  }

  async findByUserIdAndBadgeId(userId: string, badgeId: string): Promise<AchievementProgress | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND badge_id = ?`;
    const result = await dbConnection.query<AchievementProgressRow>(sql, [userId, badgeId]);
    if (result.length === 0) {
      return null;
    }
    return this.mapToModel(result[0]);
  }

  async findByUserId(userId: string): Promise<AchievementProgress[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ?`;
    const rows = await dbConnection.query<AchievementProgressRow>(sql, [userId]);
    return rows.map(this.mapToModel);
  }
}