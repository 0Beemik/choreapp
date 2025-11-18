import { DatabaseConnection } from '../connection';
import { Migration } from './migrations/MigrationManager';

const CREATE_ACHIEVEMENT_PROGRESS_TABLE_SQL = `
  CREATE TABLE achievement_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    current_progress INTEGER NOT NULL,
    required_progress INTEGER NOT NULL,
    progress_percentage REAL NOT NULL,
    estimated_completion TEXT,
    last_updated TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE(user_id, badge_id)
  );
`;

const DROP_ACHIEVEMENT_PROGRESS_TABLE_SQL = `
  DROP TABLE IF EXISTS achievement_progress;
`;

class AddAchievementsMigration implements Migration {
  version = 3;

  async up(db: DatabaseConnection): Promise<void> {
    await db.query(CREATE_ACHIEVEMENT_PROGRESS_TABLE_SQL);
  }

  async down(db: DatabaseConnection): Promise<void> {
    await db.query(DROP_ACHIEVEMENT_PROGRESS_TABLE_SQL);
  }
}

export const addAchievementsMigration = new AddAchievementsMigration();
