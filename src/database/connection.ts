import * as SQLite from 'expo-sqlite';

export type SqlParam = string | number | null;

/**
 * The only surface repositories may use. Tests supply a better-sqlite3 implementation,
 * so the exact same SQL runs in CI and on device.
 */
export interface Db {
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  get<T>(sql: string, params?: SqlParam[]): Promise<T | null>;
  run(sql: string, params?: SqlParam[]): Promise<void>;
  exec(sql: string): Promise<void>;
  /** Nested calls join the outer transaction. */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}

export class ExpoDb implements Db {
  private depth = 0;

  constructor(private db: SQLite.SQLiteDatabase) {}

  static async open(name = 'family-chores.db'): Promise<ExpoDb> {
    return new ExpoDb(await SQLite.openDatabaseAsync(name));
  }

  all<T>(sql: string, params: SqlParam[] = []) {
    return this.db.getAllAsync<T>(sql, params);
  }

  get<T>(sql: string, params: SqlParam[] = []) {
    return this.db.getFirstAsync<T>(sql, params);
  }

  async run(sql: string, params: SqlParam[] = []) {
    await this.db.runAsync(sql, params);
  }

  exec(sql: string) {
    return this.db.execAsync(sql);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.depth > 0) return fn();
    let result!: T;
    this.depth++;
    try {
      await this.db.withTransactionAsync(async () => {
        result = await fn();
      });
    } finally {
      this.depth--;
    }
    return result;
  }
}
