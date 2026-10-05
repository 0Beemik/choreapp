import type { Db, SqlParam } from '../database';
import type { Row, Snapshot } from './protocol';

// Parents before children so foreign keys hold on insert (and the reverse on delete).
const TABLES = ['families', 'users', 'chores', 'vacations', 'chore_assignments', 'point_transactions', 'user_badges'];

export async function dataVersion(db: Db): Promise<number> {
  const row = await db.get<{ value: number }>(`SELECT value FROM sync_meta WHERE key = 'version'`);
  return row?.value ?? 0;
}

export async function exportSnapshot(db: Db): Promise<Snapshot> {
  const tables: Record<string, Row[]> = {};
  for (const t of TABLES) tables[t] = await db.all<Row>(`SELECT * FROM ${t}`);
  // The PIN never leaves the hub: parent tools only run there.
  tables.families = tables.families.map((f) => ({ ...f, pin_hash: '', pin_salt: '' }));
  return { version: await dataVersion(db), tables };
}

/** Replaces this device's copy of the family with the hub's. */
export async function importSnapshot(db: Db, snap: Snapshot): Promise<void> {
  await db.transaction(async () => {
    for (const t of [...TABLES].reverse()) await db.run(`DELETE FROM ${t}`);
    for (const t of TABLES) {
      for (const row of snap.tables[t] ?? []) {
        const cols = Object.keys(row);
        if (cols.length === 0 || cols.some((c) => !/^[a-z_]+$/.test(c))) continue;
        await db.run(
          `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
          cols.map((c) => row[c] as SqlParam),
        );
      }
    }
  });
}
