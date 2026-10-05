import type { Db } from '../database';
import type { Role, User } from '../models';

interface UserRow {
  id: string;
  family_id: string;
  name: string;
  age: number;
  role: string;
  avatar_emoji: string;
  avatar_color: string;
  allowance_rate: number;
  created_at: string;
}

const toModel = (r: UserRow): User => ({
  id: r.id,
  familyId: r.family_id,
  name: r.name,
  age: r.age,
  role: r.role as Role,
  avatarEmoji: r.avatar_emoji,
  avatarColor: r.avatar_color,
  allowanceRate: r.allowance_rate,
  createdAt: r.created_at,
});

export class UserRepository {
  constructor(private db: Db) {}

  async insert(u: User): Promise<void> {
    await this.db.run(
      `INSERT INTO users (id, family_id, name, age, role, avatar_emoji, avatar_color, allowance_rate, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.familyId, u.name, u.age, u.role, u.avatarEmoji, u.avatarColor, u.allowanceRate, u.createdAt],
    );
  }

  async update(u: User): Promise<void> {
    await this.db.run(
      `UPDATE users SET name = ?, age = ?, role = ?, avatar_emoji = ?, avatar_color = ?, allowance_rate = ?
       WHERE id = ?`,
      [u.name, u.age, u.role, u.avatarEmoji, u.avatarColor, u.allowanceRate, u.id],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM users WHERE id = ?', [id]);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.get<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
    return row ? toModel(row) : null;
  }

  async findByFamily(familyId: string): Promise<User[]> {
    const rows = await this.db.all<UserRow>(
      `SELECT * FROM users WHERE family_id = ?
       ORDER BY CASE role WHEN 'child' THEN 0 ELSE 1 END, created_at`,
      [familyId],
    );
    return rows.map(toModel);
  }
}
