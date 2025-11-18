import * as SQLite from 'expo-sqlite';

export interface DatabaseConnection {
  initialize(): Promise<void>;
  close(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryInTransaction<T>(tx: SQLite.SQLiteTransaction, sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(
    callback: (tx: SQLite.SQLiteTransaction) => Promise<T>,
    options?: { readOnly: boolean }
  ): Promise<T>;
}

class SQLiteConnection implements DatabaseConnection {
  private db!: SQLite.SQLiteDatabase;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('family-chores.db');
  }

  async close(): Promise<void> {
    await this.db.closeAsync();
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.db.getAllAsync<T>(sql, params);
    return result;
  }

  async queryInTransaction<T>(tx: SQLite.SQLiteTransaction, sql: string, params: unknown[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        sql,
        params,
        (_, { rows }) => resolve(rows._array as T[]),
        (_, error) => {
          reject(error);
          return true; // Rollback
        }
      );
    });
  }

  async transaction<T>(
    callback: (tx: SQLite.SQLiteTransaction) => Promise<T>,
    options: { readOnly: boolean } = { readOnly: false }
  ): Promise<T> {
    return this.db.transactionAsync(callback, options.readOnly);
  }
}

export const dbConnection = new SQLiteConnection();