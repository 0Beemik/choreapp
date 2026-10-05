import type { Db } from '../database';
import type { DayKey } from '../lib/dates';
import type { AssignmentStatus, ChoreAssignment } from '../models';

interface AssignmentRow {
  id: string;
  family_id: string;
  chore_id: string;
  user_id: string;
  period_start: string;
  due_date: string;
  status: string;
  completed_at: string | null;
  points_awarded: number;
  points_spent: number;
  created_at: string;
}

const toModel = (r: AssignmentRow): ChoreAssignment => ({
  id: r.id,
  familyId: r.family_id,
  choreId: r.chore_id,
  userId: r.user_id,
  periodStart: r.period_start,
  dueDate: r.due_date,
  status: r.status as AssignmentStatus,
  completedAt: r.completed_at,
  pointsAwarded: r.points_awarded,
  pointsSpent: r.points_spent,
  createdAt: r.created_at,
});

export class AssignmentRepository {
  constructor(private db: Db) {}

  /** Ignores duplicates so re-running assignment for a period is harmless. */
  async insert(a: ChoreAssignment): Promise<void> {
    await this.db.run(
      `INSERT OR IGNORE INTO chore_assignments
         (id, family_id, chore_id, user_id, period_start, due_date, status, completed_at,
          points_awarded, points_spent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.familyId, a.choreId, a.userId, a.periodStart, a.dueDate, a.status, a.completedAt,
        a.pointsAwarded, a.pointsSpent, a.createdAt],
    );
  }

  async findById(id: string): Promise<ChoreAssignment | null> {
    const row = await this.db.get<AssignmentRow>('SELECT * FROM chore_assignments WHERE id = ?', [id]);
    return row ? toModel(row) : null;
  }

  async setStatus(
    id: string,
    status: AssignmentStatus,
    fields: { completedAt?: string | null; pointsAwarded?: number; pointsSpent?: number } = {},
  ): Promise<void> {
    await this.db.run(
      `UPDATE chore_assignments SET status = ?, completed_at = ?, points_awarded = ?, points_spent = ?
       WHERE id = ?`,
      [status, fields.completedAt ?? null, fields.pointsAwarded ?? 0, fields.pointsSpent ?? 0, id],
    );
  }

  async reassign(id: string, userId: string): Promise<void> {
    await this.db.run('UPDATE chore_assignments SET user_id = ? WHERE id = ?', [userId, id]);
  }

  async findByPeriod(familyId: string, periodStart: DayKey): Promise<ChoreAssignment[]> {
    const rows = await this.db.all<AssignmentRow>(
      'SELECT * FROM chore_assignments WHERE family_id = ? AND period_start = ? ORDER BY due_date, created_at',
      [familyId, periodStart],
    );
    return rows.map(toModel);
  }

  async findPendingDueBefore(familyId: string, day: DayKey): Promise<ChoreAssignment[]> {
    const rows = await this.db.all<AssignmentRow>(
      `SELECT * FROM chore_assignments WHERE family_id = ? AND status = 'pending' AND due_date < ?`,
      [familyId, day],
    );
    return rows.map(toModel);
  }

  /** Deletes untouched future work for a chore, e.g. when it is edited or removed. */
  async deletePendingForChore(choreId: string, fromDay: DayKey): Promise<void> {
    await this.db.run(
      `DELETE FROM chore_assignments WHERE chore_id = ? AND status = 'pending' AND due_date >= ?`,
      [choreId, fromDay],
    );
  }

  async deletePendingForPeriod(familyId: string, periodStart: DayKey, fromDay: DayKey): Promise<void> {
    await this.db.run(
      `DELETE FROM chore_assignments
       WHERE family_id = ? AND period_start = ? AND status = 'pending' AND due_date >= ?`,
      [familyId, periodStart, fromDay],
    );
  }

  async deletePendingFrom(familyId: string, fromDay: DayKey): Promise<void> {
    await this.db.run(
      `DELETE FROM chore_assignments WHERE family_id = ? AND status = 'pending' AND due_date >= ?`,
      [familyId, fromDay],
    );
  }

  async countBuyouts(userId: string, from: DayKey, to: DayKey): Promise<number> {
    const row = await this.db.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM chore_assignments
       WHERE user_id = ? AND status = 'bought_out' AND due_date BETWEEN ? AND ?`,
      [userId, from, to],
    );
    return row?.n ?? 0;
  }

  async countCompleted(userId: string): Promise<number> {
    const row = await this.db.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM chore_assignments WHERE user_id = ? AND status = 'completed'`,
      [userId],
    );
    return row?.n ?? 0;
  }

  /** Local days on which the user completed at least one chore, newest first. */
  async completionDays(userId: string, limit = 60): Promise<DayKey[]> {
    const rows = await this.db.all<{ d: string }>(
      `SELECT DISTINCT substr(completed_at, 1, 10) AS d FROM chore_assignments
       WHERE user_id = ? AND status = 'completed' AND completed_at IS NOT NULL
       ORDER BY d DESC LIMIT ?`,
      [userId, limit],
    );
    return rows.map((r) => r.d);
  }
}
