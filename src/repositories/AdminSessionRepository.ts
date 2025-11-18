import { AdminSession } from '../models/AdminSession';
import { BaseRepository, IBaseRepository } from './BaseRepository';
import { AdminPermission } from '../types';

export interface IAdminSessionRepository extends IBaseRepository<AdminSession> {
  findBySessionId(sessionId: string): Promise<AdminSession | null>;
}

interface AdminSessionRow {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  permissions: string;
  last_activity: string;
}

export class AdminSessionRepository extends BaseRepository<AdminSession> implements IAdminSessionRepository {
  protected tableName = 'admin_sessions';

  protected mapToModel(row: unknown): AdminSession {
    const typedRow = row as AdminSessionRow;
    return {
      id: typedRow.id,
      userId: typedRow.user_id,
      createdAt: new Date(typedRow.created_at),
      expiresAt: new Date(typedRow.expires_at),
      permissions: JSON.parse(typedRow.permissions) as AdminPermission[],
      lastActivity: new Date(typedRow.last_activity),
    };
  }

  async findBySessionId(sessionId: string): Promise<AdminSession | null> {
    return this.findById(sessionId);
  }
}
