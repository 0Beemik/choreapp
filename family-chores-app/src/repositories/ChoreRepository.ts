import { Chore } from '../models/Chore';
import { BaseRepository, IBaseRepository } from './BaseRepository';
import { ChoreCategory } from '../types';
import { dbConnection } from '../database/connection';

export interface IChoreRepository extends IBaseRepository<Chore> {
  findByFamilyId(familyId: string): Promise<Chore[]>;
}

interface ChoreRow {
  id: string;
  family_id: string;
  name: string;
  description?: string;
  icon_name?: string;
  category: ChoreCategory;
  estimated_minutes?: number;
  is_active: number;
  created_at: string;
}

export class ChoreRepository extends BaseRepository<Chore> implements IChoreRepository {
  protected tableName = 'chores';

  protected mapToModel(row: unknown): Chore {
    const typedRow = row as ChoreRow;
    return {
      id: typedRow.id,
      familyId: typedRow.family_id,
      name: typedRow.name,
      description: typedRow.description,
      iconName: typedRow.icon_name,
      category: typedRow.category,
      estimatedMinutes: typedRow.estimated_minutes,
      isActive: !!typedRow.is_active,
      createdAt: new Date(typedRow.created_at),
    };
  }

  async findByFamilyId(familyId: string): Promise<Chore[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE family_id = ?`;
    const rows = await dbConnection.query(sql, [familyId]);
    return rows.map(this.mapToModel);
  }
}