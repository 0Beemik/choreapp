import type { Db } from '../database';
import type { DayKey } from '../lib/dates';
import type { Vacation } from '../models';

interface VacationRow {
  id: string;
  family_id: string;
  start_date: string;
  end_date: string;
}

const toModel = (r: VacationRow): Vacation => ({
  id: r.id,
  familyId: r.family_id,
  startDate: r.start_date,
  endDate: r.end_date,
});

export class VacationRepository {
  constructor(private db: Db) {}

  async insert(v: Vacation): Promise<void> {
    await this.db.run(
      'INSERT INTO vacations (id, family_id, start_date, end_date) VALUES (?, ?, ?, ?)',
      [v.id, v.familyId, v.startDate, v.endDate],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM vacations WHERE id = ?', [id]);
  }

  /** Vacations that have not finished yet, soonest first. */
  async upcoming(familyId: string, today: DayKey): Promise<Vacation[]> {
    const rows = await this.db.all<VacationRow>(
      'SELECT * FROM vacations WHERE family_id = ? AND end_date >= ? ORDER BY start_date',
      [familyId, today],
    );
    return rows.map(toModel);
  }

  async overlapping(familyId: string, from: DayKey, to: DayKey): Promise<Vacation[]> {
    const rows = await this.db.all<VacationRow>(
      'SELECT * FROM vacations WHERE family_id = ? AND start_date <= ? AND end_date >= ?',
      [familyId, to, from],
    );
    return rows.map(toModel);
  }
}
