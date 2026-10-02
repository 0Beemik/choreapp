import type { Db } from '../database';
import type { DayKey, Weekday } from '../lib/dates';
import type { Family, FamilySettings } from '../models';

interface FamilyRow {
  id: string;
  name: string;
  points_per_chore: number;
  buyout_cost_percentage: number;
  max_buyouts_per_month: number;
  rotation_day: string;
  missed_chore_penalty: number;
  pin_hash: string;
  pin_salt: string;
  current_period_start: string | null;
  created_at: string;
}

const toModel = (r: FamilyRow): Family => ({
  id: r.id,
  name: r.name,
  currentPeriodStart: r.current_period_start,
  createdAt: r.created_at,
  settings: {
    pointsPerChore: r.points_per_chore,
    buyoutCostPercentage: r.buyout_cost_percentage,
    maxBuyoutsPerMonth: r.max_buyouts_per_month,
    rotationDay: r.rotation_day as Weekday,
    missedChorePenalty: r.missed_chore_penalty,
  },
});

export class FamilyRepository {
  constructor(private db: Db) {}

  async insert(f: Family, pin: { hash: string; salt: string }): Promise<void> {
    const s = f.settings;
    await this.db.run(
      `INSERT INTO families (id, name, points_per_chore, buyout_cost_percentage, max_buyouts_per_month,
         rotation_day, missed_chore_penalty, pin_hash, pin_salt, current_period_start, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [f.id, f.name, s.pointsPerChore, s.buyoutCostPercentage, s.maxBuyoutsPerMonth, s.rotationDay,
        s.missedChorePenalty, pin.hash, pin.salt, f.currentPeriodStart, f.createdAt],
    );
  }

  async first(): Promise<Family | null> {
    const row = await this.db.get<FamilyRow>('SELECT * FROM families ORDER BY created_at LIMIT 1');
    return row ? toModel(row) : null;
  }

  async findById(id: string): Promise<Family | null> {
    const row = await this.db.get<FamilyRow>('SELECT * FROM families WHERE id = ?', [id]);
    return row ? toModel(row) : null;
  }

  async getPin(id: string): Promise<{ hash: string; salt: string } | null> {
    const row = await this.db.get<FamilyRow>('SELECT pin_hash, pin_salt FROM families WHERE id = ?', [id]);
    return row ? { hash: row.pin_hash, salt: row.pin_salt } : null;
  }

  async setPin(id: string, pin: { hash: string; salt: string }): Promise<void> {
    await this.db.run('UPDATE families SET pin_hash = ?, pin_salt = ? WHERE id = ?', [pin.hash, pin.salt, id]);
  }

  async updateName(id: string, name: string): Promise<void> {
    await this.db.run('UPDATE families SET name = ? WHERE id = ?', [name, id]);
  }

  async updateSettings(id: string, s: FamilySettings): Promise<void> {
    await this.db.run(
      `UPDATE families SET points_per_chore = ?, buyout_cost_percentage = ?, max_buyouts_per_month = ?,
         rotation_day = ?, missed_chore_penalty = ? WHERE id = ?`,
      [s.pointsPerChore, s.buyoutCostPercentage, s.maxBuyoutsPerMonth, s.rotationDay, s.missedChorePenalty, id],
    );
  }

  async setCurrentPeriod(id: string, periodStart: DayKey | null): Promise<void> {
    await this.db.run('UPDATE families SET current_period_start = ? WHERE id = ?', [periodStart, id]);
  }

  async deleteAll(): Promise<void> {
    await this.db.run('DELETE FROM families');
  }
}
