import { migrate } from '.';
import { NodeDb } from '../testing/nodeDb';
import { MIGRATIONS } from './schema';

describe('v3/v4 migrations (several kids, part of day)', () => {
  it('keeps existing chores, assignments and point history linked', async () => {
    const db = new NodeDb();
    // A database as shipped before v3.
    await db.exec(MIGRATIONS[0]);
    await db.exec(MIGRATIONS[1]);
    await db.exec('PRAGMA user_version = 2;');
    await db.exec(`
      INSERT INTO families (id, name, pin_hash, pin_salt, created_at) VALUES ('f', 'Fam', 'h', 's', 't');
      INSERT INTO users (id, family_id, name, age, role, avatar_emoji, avatar_color, created_at)
        VALUES ('ava', 'f', 'Ava', 9, 'child', 'x', 'y', 't');
      INSERT INTO chores (id, family_id, name, icon, frequency, fixed_user_id, created_at)
        VALUES ('fish', 'f', 'Feed fish', 'x', 'daily', 'ava', 't'),
               ('trash', 'f', 'Trash', 'x', 'weekly', NULL, 't');
      INSERT INTO chore_assignments (id, family_id, chore_id, user_id, period_start, due_date, status, created_at)
        VALUES ('fish:2026-10-04', 'f', 'fish', 'ava', '2026-10-04', '2026-10-04', 'completed', 't');
      INSERT INTO point_transactions (id, family_id, user_id, assignment_id, type, amount, reason, created_at)
        VALUES ('p1', 'f', 'ava', 'fish:2026-10-04', 'earned', 5, 'Feed fish', 't');
    `);
    const versionBefore = (await db.get<{ value: number }>(`SELECT value FROM sync_meta WHERE key = 'version'`))!.value;

    await migrate(db);

    const chores = await db.all<{ id: string; assignee_ids: string; fixed_user_id: string | null }>(
      'SELECT id, assignee_ids, fixed_user_id FROM chores ORDER BY id',
    );
    expect(chores).toEqual([
      { id: 'fish', assignee_ids: '["ava"]', fixed_user_id: null },
      { id: 'trash', assignee_ids: '[]', fixed_user_id: null },
    ]);
    // v4: existing chores become all-day.
    expect(await db.all('SELECT DISTINCT time_of_day FROM chores')).toEqual([{ time_of_day: 'any' }]);
    expect(await db.get('SELECT assignment_id FROM point_transactions')).toEqual({ assignment_id: 'fish:2026-10-04' });
    expect(await db.all('SELECT id FROM chore_assignments')).toEqual([{ id: 'fish:2026-10-04' }]);
    expect(await db.get('PRAGMA foreign_keys')).toEqual({ foreign_keys: 1 });

    // Same chore and day for a second kid is now allowed; same kid twice is not.
    await db.exec(`INSERT INTO users (id, family_id, name, age, role, avatar_emoji, avatar_color, created_at)
      VALUES ('ben', 'f', 'Ben', 6, 'child', 'x', 'y', 't')`);
    await db.exec(`INSERT INTO chore_assignments (id, family_id, chore_id, user_id, period_start, due_date, created_at)
      VALUES ('b', 'f', 'fish', 'ben', '2026-10-04', '2026-10-04', 't')`);
    await expect(
      db.exec(`INSERT INTO chore_assignments (id, family_id, chore_id, user_id, period_start, due_date, created_at)
        VALUES ('c', 'f', 'fish', 'ben', '2026-10-04', '2026-10-04', 't')`),
    ).rejects.toThrow(/UNIQUE/);

    // Sync triggers survived the table rebuild.
    const versionAfter = (await db.get<{ value: number }>(`SELECT value FROM sync_meta WHERE key = 'version'`))!.value;
    expect(versionAfter).toBeGreaterThan(versionBefore + 1);
  });
});
