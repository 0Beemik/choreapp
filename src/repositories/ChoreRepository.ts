import type { Db } from '../database';
import type { Chore, ChoreFrequency, TimeOfDay } from '../models';

interface ChoreRow {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  frequency: string;
  points: number | null;
  assignee_ids: string;
  time_of_day: string;
  rotation_offset: number;
  is_active: number;
  created_at: string;
}

const toModel = (r: ChoreRow): Chore => ({
  id: r.id,
  familyId: r.family_id,
  name: r.name,
  icon: r.icon,
  frequency: r.frequency as ChoreFrequency,
  points: r.points,
  assigneeIds: parseIds(r.assignee_ids),
  timeOfDay: r.time_of_day as TimeOfDay,
  rotationOffset: r.rotation_offset,
  isActive: r.is_active === 1,
  createdAt: r.created_at,
});

function parseIds(json: string): string[] {
  try {
    const ids: unknown = JSON.parse(json);
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export class ChoreRepository {
  constructor(private db: Db) {}

  async insert(c: Chore): Promise<void> {
    await this.db.run(
      `INSERT INTO chores (id, family_id, name, icon, frequency, points, assignee_ids, time_of_day, rotation_offset, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.familyId, c.name, c.icon, c.frequency, c.points, JSON.stringify(c.assigneeIds), c.timeOfDay, c.rotationOffset,
        c.isActive ? 1 : 0, c.createdAt],
    );
  }

  async update(c: Chore): Promise<void> {
    await this.db.run(
      `UPDATE chores SET name = ?, icon = ?, frequency = ?, points = ?, assignee_ids = ?, time_of_day = ?, is_active = ?
       WHERE id = ?`,
      [c.name, c.icon, c.frequency, c.points, JSON.stringify(c.assigneeIds), c.timeOfDay, c.isActive ? 1 : 0, c.id],
    );
  }

  async findById(id: string): Promise<Chore | null> {
    const row = await this.db.get<ChoreRow>('SELECT * FROM chores WHERE id = ?', [id]);
    return row ? toModel(row) : null;
  }

  async findActive(familyId: string): Promise<Chore[]> {
    const rows = await this.db.all<ChoreRow>(
      'SELECT * FROM chores WHERE family_id = ? AND is_active = 1 ORDER BY created_at',
      [familyId],
    );
    return rows.map(toModel);
  }

  async nextRotationOffset(familyId: string): Promise<number> {
    const row = await this.db.get<{ n: number }>(
      'SELECT COALESCE(MAX(rotation_offset) + 1, 0) AS n FROM chores WHERE family_id = ?',
      [familyId],
    );
    return row?.n ?? 0;
  }
}
