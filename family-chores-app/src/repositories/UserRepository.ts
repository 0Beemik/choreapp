import { User, UserPreferences } from '../models/User';
import { BaseRepository, IBaseRepository } from './BaseRepository';
import { UserRole } from '../types/enums';
import { dbConnection } from '../database/connection';
import { AvatarConfig } from '../types/avatar';

export interface IUserRepository extends IBaseRepository<User> {
  findByFamilyId(familyId: string): Promise<User[]>;
}

interface UserRow {
  id: string;
  family_id: string;
  name: string;
  avatar_path?: string;
  avatar_config?: string; // JSON string
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

    // Parse avatar_config JSON if present
    let avatarConfig: AvatarConfig | undefined;
    if (typedRow.avatar_config) {
      try {
        avatarConfig = JSON.parse(typedRow.avatar_config) as AvatarConfig;
      } catch (error) {
        console.error('Failed to parse avatar_config:', error);
        avatarConfig = undefined;
      }
    }

    return {
      id: typedRow.id,
      familyId: typedRow.family_id,
      name: typedRow.name,
      avatarConfig,
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