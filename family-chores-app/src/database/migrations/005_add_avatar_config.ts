import { DatabaseConnection } from '../connection';
import { Migration } from './MigrationManager';

class AddAvatarConfigMigration implements Migration {
  version = 5;

  async up(db: DatabaseConnection): Promise<void> {
    // Add avatar_config column to users table (stores JSON)
    await db.query(`
      ALTER TABLE users
      ADD COLUMN avatar_config TEXT DEFAULT NULL
    `);
  }

  async down(db: DatabaseConnection): Promise<void> {
    // SQLite doesn't support DROP COLUMN easily, so we'd need to recreate the table
    // For now, we'll leave this as a no-op or throw an error
    throw new Error('Migration rollback not implemented for this version');
  }
}

export const addAvatarConfigMigration = new AddAvatarConfigMigration();
