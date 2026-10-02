import Database from 'better-sqlite3';
import type { Db, SqlParam } from '../database';

/** Real SQLite for tests, so repository SQL is exercised exactly as on device. */
export class NodeDb implements Db {
  private db = new Database(':memory:');
  private depth = 0;

  async all<T>(sql: string, params: SqlParam[] = []) {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async get<T>(sql: string, params: SqlParam[] = []) {
    return (this.db.prepare(sql).get(...params) as T | undefined) ?? null;
  }

  async run(sql: string, params: SqlParam[] = []) {
    this.db.prepare(sql).run(...params);
  }

  async exec(sql: string) {
    this.db.exec(sql);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.depth > 0) return fn();
    this.depth++;
    this.db.exec('BEGIN');
    try {
      const result = await fn();
      this.db.exec('COMMIT');
      return result;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    } finally {
      this.depth--;
    }
  }
}
