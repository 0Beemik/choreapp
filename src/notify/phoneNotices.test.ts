import { createServices, type Services } from '../services';
import { NodeDb } from '../testing/nodeDb';
import type { Family, User } from '../models';
import { phoneNotificationsEnabled, setChoreUpdatesEnabled, setPhoneNotificationsEnabled, takeNewNotices } from './phoneNotices';

let now: Date;
let s: Services;
let family: Family;
let members: User[];
let ava: User;
let ben: User;
let cal: User;

beforeEach(async () => {
  now = new Date(2026, 9, 4, 9, 0, 0);
  s = await createServices(new NodeDb(), () => now);
  family = await s.family.setup({
    familyName: 'Testers',
    parent: { name: 'Mom', age: 0, role: 'parent' },
    pin: '1234',
    kids: [
      { name: 'Ava', age: 12, role: 'child' },
      { name: 'Ben', age: 10, role: 'child' },
      { name: 'Cal', age: 8, role: 'child' },
    ],
    chores: [],
  });
  members = await s.family.members(family.id);
  [ava, ben, cal] = ['Ava', 'Ben', 'Cal'].map((n) => members.find((m) => m.name === n)!);
});

const tick = (sec = 1) => {
  now = new Date(now.getTime() + sec * 1000);
};

async function offer(by: User, price: number) {
  await s.market.perform(family.id, by.id, { op: 'offer', price });
}

describe('phone notices', () => {
  it('never replays old news: the first check only sets the starting point', async () => {
    await offer(cal, 4);
    expect(await takeNewNotices(s, [ava.id], members)).toEqual([]);
    tick();
    await offer(cal, 5);
    const [n] = await takeNewNotices(s, [ava.id], members);
    expect(n).toMatchObject({ title: '🙋 New buy offer', body: 'Cal will do a chore for 5 🪙. Send them one from the marketplace.' });
    // Already announced: nothing the second time.
    expect(await takeNewNotices(s, [ava.id], members)).toEqual([]);
  });

  it('a kid’s phone only hears its own news', async () => {
    await takeNewNotices(s, [cal.id], members);
    tick();
    await offer(cal, 4); // goes to everyone except Cal
    expect(await takeNewNotices(s, [cal.id], members)).toEqual([]);
  });

  it('shows family-wide news once on a shared device, saying who it was for', async () => {
    const all = members.map((m) => m.id);
    await takeNewNotices(s, all, members);
    tick();
    await offer(cal, 4);
    const notices = await takeNewNotices(s, all, members);
    expect(notices).toHaveLength(1);
    expect(notices[0].title).toBe('🙋 New buy offer · For everyone');
  });

  it('does not miss news created in the same second as the last check', async () => {
    await takeNewNotices(s, [ava.id], members);
    tick();
    await offer(cal, 4);
    expect(await takeNewNotices(s, [ava.id], members)).toHaveLength(1);
    await offer(ben, 6); // same second
    const [n] = await takeNewNotices(s, [ava.id], members);
    expect(n.body).toContain('Ben will do a chore for 6');
  });

  it('collapses a pile-up into a summary plus the latest few', async () => {
    await takeNewNotices(s, [ava.id], members);
    for (let i = 1; i <= 6; i++) {
      tick();
      await offer(i % 2 ? ben : cal, i);
    }
    const notices = await takeNewNotices(s, [ava.id], members);
    expect(notices).toHaveLength(4);
    expect(notices[0].body).toBe('3 more updates waiting in the app.');
    expect(notices[3].body).toContain('for 6');
  });

  it('tells parents (not kids) when a chore is done, bundled per kid, and forgets it on undo', async () => {
    const mom = members.find((m) => m.name === 'Mom')!;
    const all = members.map((m) => m.id);
    await takeNewNotices(s, all, members);
    await takeNewNotices(s, [ava.id], members);
    const add = (name: string) =>
      s.chores.add(family.id, { name, icon: '✨', frequency: 'daily', points: null, assigneeIds: [ava.id], timeOfDay: 'any', coins: 2 });
    await add('Make bed');
    await add('Homework');
    await add('Dishes');
    const board = (await s.board.load(family.id))!.byUser[ava.id];
    tick();
    for (const a of board) await s.chores.complete(a.id);

    // The main device (whole family): one bundled pop-up, for Mom.
    const [n] = await takeNewNotices(s, all, members);
    expect(n.title).toBe('✅ Chore done · For Mom');
    expect(n.body).toMatch(/^Ava finished 3 chores: /);
    // Ava's own phone hears nothing about it.
    expect(await takeNewNotices(s, [ava.id], members)).toEqual([]);

    // Undo removes it from the bell.
    await s.chores.undo(board[0].id);
    const left = await s.notifications.list([mom.id]);
    expect(left.filter((x) => x.kind === 'chore_done')).toHaveLength(2);
  });

  it('chore updates can be muted on a device while marketplace news still pops up', async () => {
    const all = members.map((m) => m.id);
    await takeNewNotices(s, all, members);
    await setChoreUpdatesEnabled(s, false);
    await s.chores.add(family.id, { name: 'Bed', icon: '✨', frequency: 'daily', points: null, assigneeIds: [ava.id], timeOfDay: 'any', coins: 2 });
    tick();
    await s.chores.complete((await s.board.load(family.id))!.byUser[ava.id][0].id);
    await offer(cal, 3);
    const notices = await takeNewNotices(s, all, members);
    expect(notices.map((x) => x.title)).toEqual(['🙋 New buy offer · For everyone']);
  });

  it('is on by default and can be switched off per device', async () => {
    expect(await phoneNotificationsEnabled(s)).toBe(true);
    await setPhoneNotificationsEnabled(s, false);
    expect(await phoneNotificationsEnabled(s)).toBe(false);
  });
});
