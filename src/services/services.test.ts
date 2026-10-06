import { createServices, type Services } from '.';
import { NodeDb } from '../testing/nodeDb';
import { STARTER_CHORES } from '../lib/presets';
import type { Family, User } from '../models';

// Sunday 4 Oct 2026, 9am local. Families rotate on Sunday by default.
let now: Date;
const setNow = (y: number, m: number, d: number, h = 9) => {
  now = new Date(y, m - 1, d, h);
};

let s: Services;
let family: Family;
let parent: User;
let ava: User;
let ben: User;

const bed = STARTER_CHORES.find((c) => c.name === 'Make your bed')!;
const trash = STARTER_CHORES.find((c) => c.name === 'Take out the trash')!;

async function setup(chores = [bed, trash]) {
  family = await s.family.setup({
    familyName: 'The Testers',
    parent: { name: 'Mom', age: 38, role: 'parent' },
    pin: '1234',
    kids: [
      { name: 'Ava', age: 9, role: 'child', allowanceRate: 10 },
      { name: 'Ben', age: 6, role: 'child' },
    ],
    chores,
  });
  const members = await s.family.members(family.id);
  parent = members.find((m) => m.role === 'parent')!;
  ava = members.find((m) => m.name === 'Ava')!;
  ben = members.find((m) => m.name === 'Ben')!;
}

async function boardFor(user: User) {
  await s.rotation.ensureCurrentPeriod(family.id);
  return (await s.board.load(family.id))!.byUser[user.id] ?? [];
}

/** The kid who drew the (single) rotating chore this week. */
async function kidWithChores() {
  return (await boardFor(ava)).length ? ava : ben;
}

async function balance(user: User) {
  return (await s.points.balances(family.id))[user.id] ?? 0;
}

beforeEach(async () => {
  setNow(2026, 10, 4);
  s = await createServices(new NodeDb(), () => now);
});

describe('family setup', () => {
  it('creates the family, members and a full first week of chores', async () => {
    await setup();
    expect(await s.family.current()).toMatchObject({ name: 'The Testers', currentPeriodStart: '2026-10-04' });
    expect((await s.family.members(family.id)).map((m) => m.name)).toEqual(['Ava', 'Ben', 'Mom']);

    const week = await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04');
    // 7 daily "make your bed" + 1 weekly trash, each owned by exactly one kid.
    expect(week).toHaveLength(8);
    expect(new Set(week.filter((a) => a.choreId === week[0].choreId).map((a) => a.userId)).size).toBe(1);
    // Two rotating chores land on different kids the same week.
    expect(new Set(week.map((a) => a.userId))).toEqual(new Set([ava.id, ben.id]));
    expect(week.every((a) => a.userId !== parent.id)).toBe(true);
  });

  it('rejects bad input with friendly messages', async () => {
    const base = { familyName: 'X', parent: { name: 'Mom', age: 30, role: 'parent' as const }, pin: '1234', kids: [], chores: [] };
    await expect(s.family.setup(base)).rejects.toThrow('Family name');
    await expect(s.family.setup({ ...base, familyName: 'Smiths', pin: '12' })).rejects.toThrow('4 digits');
    await expect(s.family.setup({ ...base, familyName: 'Smiths' })).rejects.toThrow('at least one kid');
  });

  it('verifies and changes the parent PIN', async () => {
    await setup();
    expect(await s.family.verifyPin(family.id, '1234')).toBe(true);
    expect(await s.family.verifyPin(family.id, '9999')).toBe(false);
    await s.family.changePin(family.id, '4321');
    expect(await s.family.verifyPin(family.id, '4321')).toBe(true);
    expect(await s.family.verifyPin(family.id, '1234')).toBe(false);
  });

  it('is idempotent: re-checking the period never duplicates chores', async () => {
    await setup();
    await s.rotation.ensureCurrentPeriod(family.id);
    await s.rotation.ensureCurrentPeriod(family.id);
    expect(await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04')).toHaveLength(8);
  });
});

describe('completing chores', () => {
  it('awards points, the first-chore badge and its bonus', async () => {
    await setup([bed]);
    const kid = await kidWithChores();
    const [today] = await boardFor(kid);

    const result = await s.chores.complete(today.id);
    expect(result.pointsAwarded).toBe(10);
    expect(result.newBadges.map((b) => b.id)).toContain('first_chore');
    expect(await balance(kid)).toBe(15); // 10 + 5 badge bonus
    await expect(s.chores.complete(today.id)).rejects.toThrow('already');
  });

  it('undo takes the points back', async () => {
    await setup([bed]);
    const kid = await kidWithChores();
    const [a] = await boardFor(kid);
    await s.chores.complete(a.id);
    await s.chores.undo(a.id);
    expect((await s.deps.repos.assignments.findById(a.id))!.status).toBe('pending');
    expect(await balance(kid)).toBe(5); // badge bonus is kept
  });

  it('shows today’s daily chores and the week’s weekly chores only', async () => {
    await setup();
    const all = [...(await boardFor(ava)), ...(await boardFor(ben))];
    expect(all).toHaveLength(2);
    expect(all.every((a) => a.dueDate === '2026-10-04' || a.dueDate === '2026-10-10')).toBe(true);
  });
});

describe('buyouts', () => {
  it('needs enough points and respects the monthly limit', async () => {
    await setup([bed]);
    const kid = await kidWithChores();
    const [first] = await boardFor(kid);

    let quote = await s.chores.buyoutQuote(first.id);
    expect(quote).toMatchObject({ cost: 10, balance: 0, allowed: false });
    await expect(s.chores.buyout(first.id)).rejects.toThrow('more points');

    await s.points.adjust(family.id, kid.id, 100, 'Birthday');
    await s.family.updateSettings(family.id, { ...family.settings, maxBuyoutsPerMonth: 1 });
    quote = await s.chores.buyoutQuote(first.id);
    expect(quote.allowed).toBe(true);
    await s.chores.buyout(first.id);
    expect(await balance(kid)).toBe(90);

    setNow(2026, 10, 5);
    const [second] = await boardFor(kid);
    expect((await s.chores.buyoutQuote(second.id)).reason).toBe('No skips left this month.');
  });
});

describe('time passing', () => {
  it('marks yesterday’s undone chores as missed with a penalty', async () => {
    await setup([bed]);
    const kid = await kidWithChores();
    setNow(2026, 10, 5);
    await s.rotation.ensureCurrentPeriod(family.id);
    const sunday = (await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04')).find(
      (a) => a.dueDate === '2026-10-04',
    )!;
    expect(sunday.status).toBe('missed');
    expect(await balance(kid)).toBe(-2);
  });

  it('rotates chores to the other kid next week and crowns the weekly winner', async () => {
    await setup([bed]);
    const first = await kidWithChores();
    const other = first === ava ? ben : ava;
    await s.chores.complete((await boardFor(first))[0].id);

    setNow(2026, 10, 11); // next Sunday
    expect(await boardFor(first)).toHaveLength(0);
    expect(await boardFor(other)).toHaveLength(1);
    expect((await s.badges.earned(first.id)).map((b) => b.badgeId)).toContain('weekly_winner');
  });

  it('awards a 3-day streak badge', async () => {
    await setup([bed]);
    const kid = await kidWithChores();
    let badges: string[] = [];
    for (const day of [4, 5, 6]) {
      setNow(2026, 10, day);
      const r = await s.chores.complete((await boardFor(kid))[0].id);
      badges = badges.concat(r.newBadges.map((b) => b.id));
    }
    expect(badges).toContain('streak_3');
  });

  it('counts streaks by local day even late in the evening', async () => {
    await setup([bed]);
    const kid = await kidWithChores();
    for (const day of [4, 5, 6]) {
      setNow(2026, 10, day, 23); // 11pm local is already tomorrow in UTC for the Americas
      await s.chores.complete((await boardFor(kid))[0].id);
    }
    expect((await s.badges.earned(kid.id)).map((b) => b.badgeId)).toContain('streak_3');
  });

  it('gives a perfect-week badge when every chore that week is done', async () => {
    await setup([trash]);
    const kid = await kidWithChores();
    const r = await s.chores.complete((await boardFor(kid))[0].id);
    expect(r.newBadges.map((b) => b.id)).toContain('perfect_week');
  });
});

describe('vacations', () => {
  it('excuses chores during a vacation and does not penalize them', async () => {
    await setup([bed]);
    const kid = await kidWithChores();
    await s.vacations.add(family.id, '2026-10-05', 3);
    setNow(2026, 10, 9);
    await s.rotation.ensureCurrentPeriod(family.id);
    const week = await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04');
    const status = Object.fromEntries(week.map((a) => [a.dueDate, a.status]));
    expect(status).toMatchObject({
      '2026-10-04': 'missed',
      '2026-10-05': 'excused',
      '2026-10-06': 'excused',
      '2026-10-07': 'excused',
      '2026-10-08': 'missed',
    });
    expect(await balance(kid)).toBe(-4);
  });
});

describe('parents managing the family', () => {
  it('adds a chore mid-week for the remaining days only', async () => {
    await setup([]);
    setNow(2026, 10, 7);
    await s.chores.add(family.id, { name: 'Feed fish', icon: '🐟', frequency: 'daily', points: 5, assigneeIds: [ben.id], timeOfDay: 'any' });
    const week = await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04');
    expect(week.map((a) => a.dueDate)).toEqual(['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']);
    expect(week.every((a) => a.userId === ben.id)).toBe(true);
    const r = await s.chores.complete(week[0].id);
    expect(r.pointsAwarded).toBe(5);
  });

  it('gives a chore to several kids, each doing their own', async () => {
    await setup([]);
    const chore = await s.chores.add(family.id, { name: 'Make bed', icon: '🛏️', frequency: 'daily', points: 5, assigneeIds: [ava.id, ben.id], timeOfDay: 'morning' });
    const week = await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04');
    expect(week.filter((a) => a.userId === ava.id)).toHaveLength(7);
    expect(week.filter((a) => a.userId === ben.id)).toHaveLength(7);

    // Ava doing hers leaves Ben's untouched.
    const avaToday = week.find((a) => a.userId === ava.id && a.dueDate === '2026-10-04')!;
    const benToday = week.find((a) => a.userId === ben.id && a.dueDate === '2026-10-04')!;
    await s.chores.complete(avaToday.id);
    expect((await s.deps.repos.assignments.findById(benToday.id))?.status).toBe('pending');
    await expect(s.chores.reassign(benToday.id, ava.id)).rejects.toThrow('already have this chore');

    // Back to just Ben: Ava's done one stays, her upcoming ones go.
    await s.chores.update(chore.id, { name: 'Make bed', icon: '🛏️', frequency: 'daily', points: 5, assigneeIds: [ben.id], timeOfDay: 'any' });
    const after = await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04');
    expect(after.filter((a) => a.userId === ava.id).map((a) => a.status)).toEqual(['completed']);
    expect(after.filter((a) => a.userId === ben.id)).toHaveLength(7);
    expect((await s.chores.list(family.id))[0].assigneeIds).toEqual([ben.id]);
  });

  it('parents can be given chores too', async () => {
    await setup([]);
    await s.chores.add(family.id, { name: 'Mow lawn', icon: '🚜', frequency: 'weekly', points: null, assigneeIds: [parent.id], timeOfDay: 'any' });
    expect((await boardFor(parent)).length).toBe(1);
    expect(await boardFor(ava)).toHaveLength(0);
    expect(await boardFor(ben)).toHaveLength(0);
  });

  it('orders the board morning, afternoon, evening, then all day', async () => {
    await setup([]);
    const add = (name: string, timeOfDay: 'any' | 'morning' | 'afternoon' | 'evening') =>
      s.chores.add(family.id, { name, icon: '✨', frequency: 'daily', points: null, assigneeIds: [ava.id], timeOfDay });
    await add('Anytime', 'any');
    await add('Dishes (evening)', 'evening');
    await add('Make bed', 'morning');
    await add('Homework', 'afternoon');
    const names = new Map((await s.chores.list(family.id)).map((c) => [c.id, c.name]));
    const board = await boardFor(ava);
    expect(board.map((a) => names.get(a.choreId))).toEqual(['Make bed', 'Homework', 'Dishes (evening)', 'Anytime']);
    expect((await s.chores.list(family.id)).find((c) => c.name === 'Make bed')?.timeOfDay).toBe('morning');
  });

  it('removing a chore clears its upcoming work but keeps history', async () => {
    await setup([bed]);
    const kid = await kidWithChores();
    await s.chores.complete((await boardFor(kid))[0].id);
    const [chore] = await s.chores.list(family.id);
    await s.chores.remove(chore.id);
    const week = await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04');
    expect(week.map((a) => a.status)).toEqual(['completed']);
    expect(await s.chores.list(family.id)).toHaveLength(0);
  });

  it('removing a kid hands their chores to the remaining kids', async () => {
    await setup();
    await s.family.removeMember(ben);
    const week = await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04');
    expect(week.length).toBe(8);
    expect(week.every((a) => a.userId === ava.id)).toBe(true);
  });

  it('will not remove the last parent', async () => {
    await setup();
    await expect(s.family.removeMember(parent)).rejects.toThrow('at least one parent');
  });

  it('changing the rotation day re-deals the week without duplicates', async () => {
    await setup();
    setNow(2026, 10, 6); // Tuesday
    await s.family.updateSettings(family.id, { ...family.settings, rotationDay: 'monday' });
    const week = await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-05');
    const pending = week.filter((a) => a.status === 'pending');
    expect(pending.map((a) => a.dueDate).filter((d) => d === '2026-10-06')).toHaveLength(1);
    expect(new Set(pending.map((a) => `${a.choreId}|${a.dueDate}`)).size).toBe(pending.length);
  });

  it('parents can excuse and reassign', async () => {
    await setup([trash]);
    const kid = await kidWithChores();
    const other = kid === ava ? ben : ava;
    const [a] = await boardFor(kid);
    await s.chores.reassign(a.id, other.id);
    expect(await boardFor(other)).toHaveLength(1);
    await s.chores.excuse(a.id);
    expect(await boardFor(other)).toHaveLength(0);
  });
});

describe('leaderboard and allowance', () => {
  it('ranks kids by points, sharing rank on ties', async () => {
    await setup([trash, bed]);
    let rows = await s.points.leaderboard(family.id, 'week');
    expect(rows.map((r) => r.rank)).toEqual([1, 1]);

    const [a] = await boardFor(ava);
    await s.chores.complete(a.id);
    rows = await s.points.leaderboard(family.id, 'week');
    expect(rows[0]).toMatchObject({ user: { id: ava.id }, rank: 1, completed: 1 });
    expect(rows[1]).toMatchObject({ user: { id: ben.id }, rank: 2, points: 0 });
  });

  it('pays allowance in proportion to chores done this week', async () => {
    await setup([trash]);
    const kid = await kidWithChores();
    if (kid !== ava) await s.chores.reassign((await boardFor(ben))[0].id, ava.id);
    expect(await s.points.allowance(family.id, ava.id)).toMatchObject({ done: 0, total: 1, amount: 0 });
    await s.chores.complete((await boardFor(ava))[0].id);
    expect(await s.points.allowance(family.id, ava.id)).toMatchObject({ done: 1, total: 1, amount: 10 });
  });
});
