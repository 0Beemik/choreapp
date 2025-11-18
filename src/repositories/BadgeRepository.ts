import { dbConnection } from '../database/connection';
import { Badge } from '../models/Badge';
import { BadgeCategory, Rarity } from '../types';
import { BaseRepository, IBaseRepository } from './BaseRepository';

export interface IBadgeRepository extends IBaseRepository<Badge> {
  findByName(name: string): Promise<Badge | null>;
}

interface BadgeRow {
  id: string;
  name: string;
  description: string;
  icon_path: string;
  category: BadgeCategory;
  criteria: string; // JSON string
  bonus_points: number;
  rarity: Rarity;
  is_active: number;
  created_at: string;
}

export class BadgeRepository extends BaseRepository<Badge> implements IBadgeRepository {
  protected tableName = 'badges';

  protected mapToModel(row: unknown): Badge {
    const typedRow = row as BadgeRow;
    return {
      id: typedRow.id,
      name: typedRow.name,
      description: typedRow.description,
      iconPath: typedRow.icon_path,
      category: typedRow.category,
      criteria: JSON.parse(typedRow.criteria),
      bonusPoints: typedRow.bonus_points,
      rarity: typedRow.rarity,
      isActive: !!typedRow.is_active,
      createdAt: new Date(typedRow.created_at),
    };
  }

  async findByName(name: string): Promise<Badge | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE name = ?;`;
    const result = await dbConnection.query<BadgeRow>(sql, [name]);
    if (result.length === 0) {
      return null;
    }
    return this.mapToModel(result[0]);
  }
}