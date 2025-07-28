import { DatabaseConnection } from '../connection';
import { Migration } from './MigrationManager';

const CREATE_BADGES_TABLE_SQL = `
  CREATE TABLE badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_path TEXT NOT NULL,
    category TEXT NOT NULL,
    criteria TEXT NOT NULL, -- Stored as JSON
    bonus_points INTEGER DEFAULT 0,
    rarity TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const CREATE_USER_BADGES_TABLE_SQL = `
  CREATE TABLE user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    period_start DATE,
    period_end DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
  );
`;

const CREATE_INDEXES_SQL = `
  CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
  CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
`;

const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS user_badges;
  DROP TABLE IF EXISTS badges;
`;

class AddBadgesMigration implements Migration {
  version = 2;

  async up(db: DatabaseConnection): Promise<void> {
    await db.query(CREATE_BADGES_TABLE_SQL);
    await db.query(CREATE_USER_BADGES_TABLE_SQL);
    await db.query(CREATE_INDEXES_SQL);
  }

  async down(db: DatabaseConnection): Promise<void> {
    await db.query(DROP_TABLES_SQL);
  }
}

export const addBadgesMigration = new AddBadgesMigration();