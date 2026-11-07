import type { Db } from '../database';
import type { CoinTransaction, CoinTransactionType } from '../models';

interface CoinRow {
  id: string;
  family_id: string;
  user_id: string;
  assignment_id: string | null;
  ref_id: string | null;
  type: string;
  amount: number;
  reason: string;
  created_at: string;
}

const toModel = (r: CoinRow): CoinTransaction => ({
  id: r.id,
  familyId: r.family_id,
  userId: r.user_id,
  assignmentId: r.assignment_id,
  refId: r.ref_id,
  type: r.type as CoinTransactionType,
  amount: r.amount,
  reason: r.reason,
  createdAt: r.created_at,
});

export class CoinsRepository {
  constructor(private db: Db) {}

  async insert(t: CoinTransaction): Promise<void> {
    await this.db.run(
      `INSERT INTO coin_transactions (id, family_id, user_id, assignment_id, ref_id, type, amount, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.familyId, t.userId, t.assignmentId, t.refId, t.type, t.amount, t.reason, t.createdAt],
    );
  }

  async balance(userId: string): Promise<number> {
    const row = await this.db.get<{ total: number | null }>(
      'SELECT SUM(amount) AS total FROM coin_transactions WHERE user_id = ?',
      [userId],
    );
    return row?.total ?? 0;
  }

  async balances(familyId: string): Promise<Record<string, number>> {
    const rows = await this.db.all<{ user_id: string; total: number }>(
      'SELECT user_id, SUM(amount) AS total FROM coin_transactions WHERE family_id = ? GROUP BY user_id',
      [familyId],
    );
    return Object.fromEntries(rows.map((r) => [r.user_id, r.total]));
  }

  async history(userId: string, limit = 50): Promise<CoinTransaction[]> {
    const rows = await this.db.all<CoinRow>(
      'SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?',
      [userId, limit],
    );
    return rows.map(toModel);
  }

  async findForAssignment(assignmentId: string): Promise<CoinTransaction[]> {
    const rows = await this.db.all<CoinRow>('SELECT * FROM coin_transactions WHERE assignment_id = ?', [assignmentId]);
    return rows.map(toModel);
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM coin_transactions WHERE id = ?', [id]);
  }
}
