import { dbConnection } from './connection';
import { MigrationManager } from './migrations/MigrationManager';
import { initialSchemaMigration } from './migrations/001_initial_schema';
import { addBadgesMigration } from './migrations/002_add_badges';
import { addAchievementsMigration } from './migrations/003_add_achievements';
import { addFamilyRotationFieldsMigration } from './migrations/004_add_family_rotation_fields';
import { addAvatarConfigMigration } from './migrations/005_add_avatar_config';

const migrations = [
  initialSchemaMigration,
  addBadgesMigration,
  addAchievementsMigration,
  addFamilyRotationFieldsMigration,
  addAvatarConfigMigration,
];

export const migrationManager = new MigrationManager(dbConnection, migrations);

export async function initializeDatabase(): Promise<void> {
  try {
    await dbConnection.initialize();
    await migrationManager.migrate();
    
  } catch (error) {
    
    // In a real app, you might want to show an error to the user
    // or attempt to recover.
    throw error;
  }
}
