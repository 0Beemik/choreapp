import type { Db } from '../database';
import type { Badge, BadgeCriteria, UserBadge } from '../models';

interface BadgeRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  threshold: number;
  bonus_points: number;
}

const toModel = (r: BadgeRow): Badge => ({
  id: r.id,
  name: r.name,
  description: r.description,
  icon: r.icon,
  criteria: r.criteria as BadgeCriteria,
  threshold: r.threshold,
  bonusPoints: r.bonus_points,
});

export class BadgeRepository {
  constructor(private db: Db) {}

  async all(): Promise<Badge[]> {
    const rows = await this.db.all<BadgeRow>('SELECT * FROM badges ORDER BY sort_order');
    return rows.map(toModel);
  }

  async earned(userId: string): Promise<UserBadge[]> {
    const rows = await this.db.all<{ user_id: string; badge_id: string; earned_at: string }>(
      'SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_at',
      [userId],
    );
    return rows.map((r) => ({ userId: r.user_id, badgeId: r.badge_id, earnedAt: r.earned_at }));
  }

  async award(userId: string, badgeId: string, earnedAt: string): Promise<void> {
    await this.db.run(
      'INSERT OR IGNORE INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)',
      [userId, badgeId, earnedAt],
    );
  }
}
