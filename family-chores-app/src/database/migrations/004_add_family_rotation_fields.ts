import { DatabaseConnection } from '../connection';
import { Migration } from './MigrationManager';

class AddFamilyRotationFieldsMigration implements Migration {
  version = 4;

  async up(db: DatabaseConnection): Promise<void> {
    // Add last_rotation_date column to families table
    await db.query(`
      ALTER TABLE families
      ADD COLUMN last_rotation_date DATETIME DEFAULT NULL
    `);

    // Add admin_pin column to families table (stores bcrypt hash)
    await db.query(`
      ALTER TABLE families
      ADD COLUMN admin_pin TEXT DEFAULT ''
    `);
  }

  async down(db: DatabaseConnection): Promise<void> {
    // SQLite doesn't support DROP COLUMN easily, so we'd need to recreate the table
    // For now, we'll leave this as a no-op or throw an error
    throw new Error('Migration rollback not implemented for this version');
  }
}

export const addFamilyRotationFieldsMigration = new AddFamilyRotationFieldsMigration();
