import { User, UserPreferences } from '../models/User';
import { BaseRepository, IBaseRepository } from './BaseRepository';
import { UserRole } from '../types/enums';
import { dbConnection } from '../database/connection';

export interface IUserRepository extends IBaseRepository<User> {
  findByFamilyId(familyId: string): Promise<User[]>;
}

interface UserRow {
  id: string;
  family_id: string;
  name: string;
  avatar_path?: string;
  age: number;
  role: UserRole;
  is_admin: number;
  allowance_rate: number;
  preferences_notifications: number;
  preferences_sound_effects: number;
  preferences_interface_mode: string;
  created_at: string;
}

export class UserRepository extends BaseRepository<User> implements IUserRepository {
  protected tableName = 'users';

  protected mapToModel(row: unknown): User {
    const typedRow = row as UserRow;
    return {
      id: typedRow.id,
      familyId: typedRow.family_id,
      name: typedRow.name,
      avatarPath: typedRow.avatar_path,
      age: typedRow.age,
      role: typedRow.role,
      isAdmin: !!typedRow.is_admin,
      allowanceRate: typedRow.allowance_rate,
      createdAt: new Date(typedRow.created_at),
      preferences: {
        notifications: !!typedRow.preferences_notifications,
        soundEffects: !!typedRow.preferences_sound_effects,
        interfaceMode: typedRow.preferences_interface_mode,
      } as UserPreferences,
    };
  }

  async findByFamilyId(familyId: string): Promise<User[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE family_id = ?`;
    const rows = await dbConnection.query(sql, [familyId]);
    return rows.map(this.mapToModel);
  }
}