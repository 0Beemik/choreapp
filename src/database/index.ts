import type { Db } from './connection';
import { MIGRATIONS } from './schema';

export type { Db, SqlParam } from './connection';

export async function migrate(db: Db): Promise<void> {
  await db.exec('PRAGMA foreign_keys = ON;');
  const row = await db.get<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.transaction(async () => {
      await db.exec(MIGRATIONS[v]);
      await db.exec(`PRAGMA user_version = ${v + 1};`);
    });
  }
}
