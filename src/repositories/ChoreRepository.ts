import type { Db } from '../database';
import type { Chore, ChoreFrequency } from '../models';

interface ChoreRow {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  frequency: string;
  points: number | null;
  fixed_user_id: string | null;
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
  fixedUserId: r.fixed_user_id,
  rotationOffset: r.rotation_offset,
  isActive: r.is_active === 1,
  createdAt: r.created_at,
});

export class ChoreRepository {
  constructor(private db: Db) {}

  async insert(c: Chore): Promise<void> {
    await this.db.run(
      `INSERT INTO chores (id, family_id, name, icon, frequency, points, fixed_user_id, rotation_offset, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.familyId, c.name, c.icon, c.frequency, c.points, c.fixedUserId, c.rotationOffset,
        c.isActive ? 1 : 0, c.createdAt],
    );
  }

  async update(c: Chore): Promise<void> {
    await this.db.run(
      `UPDATE chores SET name = ?, icon = ?, frequency = ?, points = ?, fixed_user_id = ?, is_active = ?
       WHERE id = ?`,
      [c.name, c.icon, c.frequency, c.points, c.fixedUserId, c.isActive ? 1 : 0, c.id],
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
