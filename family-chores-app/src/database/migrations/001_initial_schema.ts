import { DatabaseConnection } from '../connection';
import { CREATE_TABLES_SQL } from '../schema';
import { Migration } from './MigrationManager';

const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS ad_impressions;
  DROP TABLE IF EXISTS user_badges;
  DROP TABLE IF EXISTS badges;
  DROP TABLE IF EXISTS leaderboards;
  DROP TABLE IF EXISTS point_transactions;
  DROP TABLE IF EXISTS chore_assignments;
  DROP TABLE IF EXISTS chores;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS families;
`;

class InitialSchemaMigration implements Migration {
  version = 1;

  async up(db: DatabaseConnection): Promise<void> {
    // The CREATE_TABLES_SQL contains multiple statements.
    // We need to execute them one by one.
    const statements = CREATE_TABLES_SQL.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await db.query(statement);
    }
  }

  async down(db: DatabaseConnection): Promise<void> {
    const statements = DROP_TABLES_SQL.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await db.query(statement);
    }
  }
}

export const initialSchemaMigration = new InitialSchemaMigration();
