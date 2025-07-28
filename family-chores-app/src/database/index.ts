import { dbConnection } from './connection';
import { MigrationManager } from './migrations/MigrationManager';
import { initialSchemaMigration } from './migrations/001_initial_schema';
import { addBadgesMigration } from './migrations/002_add_badges';
import { addAchievementsMigration } from './migrations/003_add_achievements';

const migrations = [
  initialSchemaMigration,
  addBadgesMigration,
  addAchievementsMigration,
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
