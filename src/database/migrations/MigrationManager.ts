import { DatabaseConnection } from '../connection';

export interface Migration {
  version: number;
  up(db: DatabaseConnection): Promise<void>;
  down(db: DatabaseConnection): Promise<void>;
}

export class MigrationManager {
  constructor(
    private dbConnection: DatabaseConnection,
    private migrations: Migration[]
  ) {}

  async initializeSchema(): Promise<void> {
    await this.dbConnection.query(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async getCurrentVersion(): Promise<number> {
    const result = await this.dbConnection.query<{ version: number }>(
      'SELECT MAX(version) as version FROM schema_version;'
    );
    return result[0]?.version || 0;
  }

  async migrate(): Promise<void> {
    await this.initializeSchema();
    const currentVersion = await this.getCurrentVersion();
    const targetVersion = this.migrations.length;

    if (currentVersion >= targetVersion) {
      
      return;
    }

    for (let i = currentVersion; i < targetVersion; i++) {
      const migration = this.migrations[i];
      if (migration.version !== i + 1) {
        throw new Error(`Migration version mismatch. Expected ${i + 1}, but got ${migration.version}`);
      }
      
      
      await this.dbConnection.transaction(async () => {
        await migration.up(this.dbConnection);
        await this.dbConnection.query(
          'INSERT INTO schema_version (version) VALUES (?);',
          [migration.version]
        );
      });
      
    }
  }

  async rollback(toVersion: number = 0): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    if (toVersion >= currentVersion) {
      
      return;
    }

    for (let i = currentVersion - 1; i >= toVersion; i--) {
      const migration = this.migrations[i];
      
      await this.dbConnection.transaction(async () => {
        await migration.down(this.dbConnection);
        await this.dbConnection.query(
          'DELETE FROM schema_version WHERE version = ?;',
          [migration.version]
        );
      });
      
    }
  }
}
