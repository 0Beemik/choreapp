import type { Db } from '../database';
import type { AppNotification, NotificationKind } from '../models';

interface NotificationRow {
  id: string;
  family_id: string;
  user_id: string;
  kind: string;
  text: string;
  ref_id: string | null;
  created_at: string;
}

const toModel = (r: NotificationRow): AppNotification => ({
  id: r.id,
  familyId: r.family_id,
  userId: r.user_id,
  kind: r.kind as NotificationKind,
  text: r.text,
  refId: r.ref_id,
  createdAt: r.created_at,
});

export class NotificationRepository {
  constructor(private db: Db) {}

  async insert(n: AppNotification): Promise<void> {
    await this.db.run(
      'INSERT INTO notifications (id, family_id, user_id, kind, text, ref_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [n.id, n.familyId, n.userId, n.kind, n.text, n.refId, n.createdAt],
    );
  }

  /** Newest first, for the given people (everyone on a shared device, one person on their own phone). */
  async forUsers(userIds: string[], limit = 60): Promise<AppNotification[]> {
    if (userIds.length === 0) return [];
    const rows = await this.db.all<NotificationRow>(
      `SELECT * FROM notifications WHERE user_id IN (${userIds.map(() => '?').join(', ')})
       ORDER BY created_at DESC, rowid DESC LIMIT ?`,
      [...userIds, limit],
    );
    return rows.map(toModel);
  }

  async deleteByRef(kind: NotificationKind, refId: string): Promise<void> {
    await this.db.run('DELETE FROM notifications WHERE kind = ? AND ref_id = ?', [kind, refId]);
  }

  /** Oldest first, created at or after `since`. */
  async forUsersSince(userIds: string[], since: string): Promise<AppNotification[]> {
    if (userIds.length === 0) return [];
    const rows = await this.db.all<NotificationRow>(
      `SELECT * FROM notifications WHERE user_id IN (${userIds.map(() => '?').join(', ')}) AND created_at >= ?
       ORDER BY created_at, rowid`,
      [...userIds, since],
    );
    return rows.map(toModel);
  }

  async countSince(userIds: string[], since: string): Promise<number> {
    if (userIds.length === 0) return 0;
    const row = await this.db.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM notifications WHERE user_id IN (${userIds.map(() => '?').join(', ')}) AND created_at > ?`,
      [...userIds, since],
    );
    return row?.n ?? 0;
  }
}
