import type { Db } from '../database';

/** Small key/value store for app bookkeeping (ad pacing, launch counts). */
export class AppStateRepository {
  constructor(private db: Db) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.get<{ value: string }>('SELECT value FROM app_state WHERE key = ?', [key]);
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.run(
      'INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
  }
}
