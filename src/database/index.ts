import type { Db } from './connection';
import { MIGRATIONS } from './schema';

export type { Db, SqlParam } from './connection';

export async function migrate(db: Db): Promise<void> {
  const row = await db.get<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;
  // Foreign keys stay off while migrating: rebuilding a table (the only way to change a
  // constraint in SQLite) would otherwise fire ON DELETE actions in tables that point at it.
  // The pragma is ignored inside a transaction, so it is set out here.
  await db.exec('PRAGMA foreign_keys = OFF;');
  try {
    for (let v = current; v < MIGRATIONS.length; v++) {
      await db.transaction(async () => {
        await db.exec(MIGRATIONS[v]);
        const broken = await db.all('PRAGMA foreign_key_check;');
        if (broken.length > 0) throw new Error(`Migration ${v + 1} broke ${broken.length} foreign key(s)`);
        await db.exec(`PRAGMA user_version = ${v + 1};`);
      });
    }
  } finally {
    await db.exec('PRAGMA foreign_keys = ON;');
  }
}
