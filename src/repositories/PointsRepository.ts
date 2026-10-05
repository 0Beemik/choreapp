import type { Db } from '../database';
import type { DayKey } from '../lib/dates';
import type { PointTransaction, TransactionType } from '../models';

interface TransactionRow {
  id: string;
  family_id: string;
  user_id: string;
  assignment_id: string | null;
  type: string;
  amount: number;
  reason: string;
  created_at: string;
}

const toModel = (r: TransactionRow): PointTransaction => ({
  id: r.id,
  familyId: r.family_id,
  userId: r.user_id,
  assignmentId: r.assignment_id,
  type: r.type as TransactionType,
  amount: r.amount,
  reason: r.reason,
  createdAt: r.created_at,
});

// Points that count toward rankings and badges: what was earned, net of penalties.
// Spending points on a buyout is a purchase, not a loss of standing.
const SCORE_TYPES = `('earned', 'bonus', 'penalty', 'adjustment')`;

export class PointsRepository {
  constructor(private db: Db) {}

  async insert(t: PointTransaction): Promise<void> {
    await this.db.run(
      `INSERT INTO point_transactions (id, family_id, user_id, assignment_id, type, amount, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.familyId, t.userId, t.assignmentId, t.type, t.amount, t.reason, t.createdAt],
    );
  }

  async balance(userId: string): Promise<number> {
    const row = await this.db.get<{ total: number | null }>(
      'SELECT SUM(amount) AS total FROM point_transactions WHERE user_id = ?',
      [userId],
    );
    return row?.total ?? 0;
  }

  async balances(familyId: string): Promise<Record<string, number>> {
    const rows = await this.db.all<{ user_id: string; total: number }>(
      'SELECT user_id, SUM(amount) AS total FROM point_transactions WHERE family_id = ? GROUP BY user_id',
      [familyId],
    );
    return Object.fromEntries(rows.map((r) => [r.user_id, r.total]));
  }

  async lifetimeEarned(userId: string): Promise<number> {
    const row = await this.db.get<{ total: number | null }>(
      `SELECT SUM(amount) AS total FROM point_transactions WHERE user_id = ? AND type IN ('earned', 'bonus')`,
      [userId],
    );
    return row?.total ?? 0;
  }

  /** Score per user between two local days (inclusive); omit `from` for all time. */
  async scores(familyId: string, from: DayKey | null, to: DayKey): Promise<Record<string, number>> {
    const rows = await this.db.all<{ user_id: string; total: number }>(
      `SELECT user_id, SUM(amount) AS total FROM point_transactions
       WHERE family_id = ? AND type IN ${SCORE_TYPES}
         AND substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) <= ?
       GROUP BY user_id`,
      [familyId, from ?? '0000-00-00', to],
    );
    return Object.fromEntries(rows.map((r) => [r.user_id, r.total]));
  }

  async history(userId: string, limit = 50): Promise<PointTransaction[]> {
    const rows = await this.db.all<TransactionRow>(
      'SELECT * FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?',
      [userId, limit],
    );
    return rows.map(toModel);
  }

  async findForAssignment(assignmentId: string): Promise<PointTransaction[]> {
    const rows = await this.db.all<TransactionRow>(
      'SELECT * FROM point_transactions WHERE assignment_id = ?',
      [assignmentId],
    );
    return rows.map(toModel);
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM point_transactions WHERE id = ?', [id]);
  }
}
