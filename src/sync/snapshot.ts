import type { Db, SqlParam } from '../database';
import type { Row, Snapshot } from './protocol';

// Parents before children so foreign keys hold on insert (and the reverse on delete).
const TABLES = ['families', 'users', 'chores', 'vacations', 'chore_assignments', 'point_transactions', 'coin_transactions', 'user_badges', 'market_listings', 'notifications'];

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

// Everything the main device knows, PIN and paired devices included, except state that belongs
// to one device only (its own settings and unsent taps).
const DEVICE_ONLY = new Set(['app_state', 'sync_outbox']);

export async function exportFull(db: Db): Promise<Snapshot> {
  const names = await db.all<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  );
  const tables: Record<string, Row[]> = {};
  for (const { name } of names) {
    if (!DEVICE_ONLY.has(name)) tables[name] = await db.all<Row>(`SELECT * FROM ${name}`);
  }
  return { version: await dataVersion(db), tables };
}

/** Replaces this device's data with a full export, making it a copy of the main device. */
export async function importFull(db: Db, full: Snapshot): Promise<void> {
  const known = new Set(
    (await db.all<{ name: string }>(`SELECT name FROM sqlite_master WHERE type = 'table'`)).map((r) => r.name),
  );
  const tables = Object.keys(full.tables).filter((t) => known.has(t) && !DEVICE_ONLY.has(t) && /^[a-z_]+$/.test(t));
  await db.transaction(async () => {
    // Rows reference each other across tables; check foreign keys at commit, not per row.
    await db.exec('PRAGMA defer_foreign_keys = ON;');
    for (const t of tables) await db.run(`DELETE FROM ${t}`);
    for (const t of tables) {
      for (const row of full.tables[t]) {
        const cols = Object.keys(row);
        if (cols.length === 0 || cols.some((c) => !/^[a-z_]+$/.test(c))) continue;
        await db.run(
          `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
          cols.map((c) => row[c] as SqlParam),
        );
      }
    }
    // Inserts bumped the counter; move past the old main device's version so every phone re-downloads once.
    await db.run(`UPDATE sync_meta SET value = ? WHERE key = 'version'`, [full.version + 1]);
  });
}
