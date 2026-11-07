import { createServices, type Services } from '.';
import { NodeDb } from '../testing/nodeDb';
import type { ChoreAssignment, Family, User } from '../models';
import type { MarketOp } from './MarketService';

// Sunday 4 Oct 2026, 9am local; the chore week runs Sun 4 – Sat 10.
let now: Date;
const setNow = (y: number, m: number, d: number, h = 9) => {
  now = new Date(y, m - 1, d, h);
};

let s: Services;
let family: Family;
let mom: User;
let ava: User;
let ben: User;
let cal: User;

beforeEach(async () => {
  setNow(2026, 10, 4);
  s = await createServices(new NodeDb(), () => now);
  family = await s.family.setup({
    familyName: 'The Testers',
    parent: { name: 'Mom', age: 38, role: 'parent' },
    pin: '1234',
    kids: [
      { name: 'Ava', age: 12, role: 'child' },
      { name: 'Ben', age: 10, role: 'child' },
      { name: 'Cal', age: 9, role: 'child' },
    ],
    chores: [],
  });
  const members = await s.family.members(family.id);
  [mom, ava, ben, cal] = ['Mom', 'Ava', 'Ben', 'Cal'].map((n) => members.find((m) => m.name === n)!);
  for (const u of [mom, ava, ben, cal]) await s.coins.adjust(family.id, u.id, 100, 'Starting coins');
});

const act = (u: User, op: MarketOp) => s.market.perform(family.id, u.id, op);
const coins = async (u: User) => s.coins.balance(u.id);
const sweep = async () => s.rotation.ensureCurrentPeriod(family.id);
const assignment = async (id: string) => (await s.deps.repos.assignments.findById(id))!;
const openListings = async () => (await s.market.overview(family.id)).open;

/** A daily chore given to `who`, returning that person's assignment on `day`. */
async function choreFor(who: User, day: string, opts: { coins?: number; timeOfDay?: 'any' | 'morning' | 'afternoon' | 'evening'; name?: string } = {}) {
  const name = opts.name ?? 'Clean toilets';
  let chore = (await s.chores.list(family.id)).find((c) => c.name === name);
  if (!chore) {
    chore = await s.chores.add(family.id, {
      name,
      icon: '🚽',
      frequency: 'daily',
      points: null,
      assigneeIds: [who.id],
      timeOfDay: opts.timeOfDay ?? 'evening',
      coins: opts.coins ?? 3,
    });
  }
  const week = await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04');
  return week.find((a) => a.choreId === chore!.id && a.userId === who.id && a.dueDate === day)! as ChoreAssignment;
}

describe('selling a chore', () => {
  it('holds the price, gives the chore to the buyer, and pays them when it is done', async () => {
    const a = await choreFor(ben, '2026-10-05');
    await act(ben, { op: 'sell', assignmentId: a.id, price: 8 });
    expect(await coins(ben)).toBe(92);
    const [sale] = await openListings();
    expect(sale).toMatchObject({ kind: 'sale', price: 8, deadline: '2026-10-05T17:00:00' });

    await act(ava, { op: 'buy', listingId: sale.id });
    expect((await assignment(a.id)).userId).toBe(ava.id);
    expect(await coins(ava)).toBe(100); // nothing until it's done

    setNow(2026, 10, 5, 18);
    await s.chores.complete(a.id);
    await sweep();
    expect(await coins(ava)).toBe(100 + 3 + 8); // chore coins + the seller's price
    expect(await coins(ben)).toBe(92);
    const notes = await s.notifications.list([ben.id]);
    expect(notes.map((n) => n.kind)).toContain('sale_bought');
    expect(notes.find((n) => n.kind === 'sale_bought')!.text).toMatch(/^⭐✓ Ava bought your “Clean toilets”/);
  });

  it('refunds the seller if the buyer never does it, and re-holds the payout if the chore is undone', async () => {
    const a = await choreFor(ben, '2026-10-05');
    await act(ben, { op: 'sell', assignmentId: a.id, price: 8 });
    await act(ava, { op: 'buy', listingId: (await openListings())[0].id });

    setNow(2026, 10, 5, 18);
    await s.chores.complete(a.id);
    await sweep();
    expect(await coins(ava)).toBe(111);
    await s.chores.undo(a.id);
    await sweep();
    expect(await coins(ava)).toBe(100);

    setNow(2026, 10, 6); // day closes with it undone
    await sweep();
    expect((await assignment(a.id)).status).toBe('missed');
    expect(await coins(ben)).toBe(100); // full refund
    expect(await coins(ava)).toBe(100);
  });

  it('a buyer cannot escape with a free skip and keep the price', async () => {
    const a = await choreFor(ben, '2026-10-05');
    await act(ben, { op: 'sell', assignmentId: a.id, price: 8 });
    await act(ava, { op: 'buy', listingId: (await openListings())[0].id });
    await s.chores.buyout(a.id);
    await sweep();
    expect(await coins(ava)).toBe(100);
    expect(await coins(ben)).toBe(100);
  });

  it('unsold: the seller keeps the chore and loses its coin value', async () => {
    const a = await choreFor(ben, '2026-10-05', { coins: 3 });
    await act(ben, { op: 'sell', assignmentId: a.id, price: 8 });
    setNow(2026, 10, 5, 17); // evening starts
    await sweep();
    expect(await coins(ben)).toBe(97);
    expect((await assignment(a.id)).userId).toBe(ben.id);
    expect((await s.notifications.list([ben.id]))[0].kind).toBe('sale_unsold');
  });

  it('taking it down early costs the same as not selling', async () => {
    const a = await choreFor(ben, '2026-10-05', { coins: 2 });
    await act(ben, { op: 'sell', assignmentId: a.id, price: 10 });
    await act(ben, { op: 'cancelSale', listingId: (await openListings())[0].id });
    expect(await coins(ben)).toBe(98);
  });

  it('enforces the minimum price, the weekly limit, deadlines and ownership', async () => {
    const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];
    const mine = [];
    for (const d of days) mine.push(await choreFor(ben, d));
    await expect(act(ben, { op: 'sell', assignmentId: mine[0].id, price: 4 })).rejects.toThrow('from 5 to 1000');
    await expect(act(ava, { op: 'sell', assignmentId: mine[0].id, price: 8 })).rejects.toThrow('isn’t yours');
    for (const a of mine.slice(0, 3)) await act(ben, { op: 'sell', assignmentId: a.id, price: 5 });
    await expect(act(ben, { op: 'sell', assignmentId: mine[3].id, price: 5 })).rejects.toThrow('all 3 sales');
    await expect(act(ben, { op: 'sell', assignmentId: mine[0].id, price: 5 })).rejects.toThrow('already on the market');

    // Today's evening chore can still be sold before 5pm, not after.
    const today = await choreFor(ben, '2026-10-04');
    await s.family.updateSettings(family.id, { ...family.settings, maxSalesPerWeek: 10 });
    setNow(2026, 10, 4, 17);
    await expect(act(ben, { op: 'sell', assignmentId: today.id, price: 5 })).rejects.toThrow('Too late');
  });

  it('cannot buy your own chore, a chore you already have that day, or a sale already taken', async () => {
    const a = await choreFor(ben, '2026-10-05');
    await act(ben, { op: 'sell', assignmentId: a.id, price: 8 });
    const sale = (await openListings())[0];
    await expect(act(ben, { op: 'buy', listingId: sale.id })).rejects.toThrow('your own');

    // Cal already has toilets on Monday (shared chore).
    const shared = await s.chores.add(family.id, { name: 'Make bed', icon: '🛏️', frequency: 'daily', points: null, assigneeIds: [ben.id, cal.id], timeOfDay: 'evening', coins: 2 });
    const bensBed = (await s.deps.repos.assignments.findByPeriod(family.id, '2026-10-04')).find(
      (x) => x.choreId === shared.id && x.userId === ben.id && x.dueDate === '2026-10-05',
    )!;
    await act(ben, { op: 'sell', assignmentId: bensBed.id, price: 6 });
    const bedSale = (await openListings()).find((l) => l.assignmentId === bensBed.id)!;
    await expect(act(cal, { op: 'buy', listingId: bedSale.id })).rejects.toThrow('already has that chore');

    await act(ava, { op: 'buy', listingId: sale.id });
    await expect(act(mom, { op: 'buy', listingId: sale.id })).rejects.toThrow('Too late');
  });

  it('needs enough coins', async () => {
    const a = await choreFor(ben, '2026-10-05');
    await s.coins.adjust(family.id, ben.id, -97, 'spent');
    await expect(act(ben, { op: 'sell', assignmentId: a.id, price: 5 })).rejects.toThrow('costs 5 🪙 and Ben has 3');
  });
});

describe('buy offers', () => {
  it('a seller sends a chore to an offer; nothing changes unless it is accepted', async () => {
    const a = await choreFor(ben, '2026-10-05');
    await act(cal, { op: 'offer', price: 4 });
    const offer = (await openListings()).find((l) => l.kind === 'offer')!;

    await act(ben, { op: 'send', assignmentId: a.id, offerId: offer.id });
    expect(await coins(ben)).toBe(96);
    const handoff = (await openListings()).find((l) => l.kind === 'handoff')!;
    expect((await s.notifications.list([cal.id])).some((n) => n.kind === 'handoff_request')).toBe(true);

    // Declined: back to how it was.
    await act(cal, { op: 'answerHandoff', listingId: handoff.id, accept: false });
    expect(await coins(ben)).toBe(100);
    expect((await assignment(a.id)).userId).toBe(ben.id);

    // Sent again and accepted: Cal does it and gets the offer price on top of the chore's coins.
    await act(ben, { op: 'send', assignmentId: a.id, offerId: offer.id });
    const again = (await openListings()).find((l) => l.kind === 'handoff')!;
    await act(cal, { op: 'answerHandoff', listingId: again.id, accept: true });
    expect((await assignment(a.id)).userId).toBe(cal.id);
    setNow(2026, 10, 5, 18);
    await s.chores.complete(a.id);
    await sweep();
    expect(await coins(cal)).toBe(100 + 3 + 4);
    expect(await coins(ben)).toBe(96);
  });

  it('handoffs do not count toward the sales limit and refund in full if unanswered', async () => {
    await s.family.updateSettings(family.id, { ...family.settings, maxSalesPerWeek: 0 });
    const a = await choreFor(ben, '2026-10-05');
    await act(cal, { op: 'offer', price: 4 });
    const offer = (await openListings()).find((l) => l.kind === 'offer')!;
    await act(ben, { op: 'send', assignmentId: a.id, offerId: offer.id });
    setNow(2026, 10, 5, 17);
    await sweep();
    expect(await coins(ben)).toBe(100);
    expect((await assignment(a.id)).userId).toBe(ben.id);
  });

  it('posting a new offer replaces the old one; offers end with the week', async () => {
    await act(cal, { op: 'offer', price: 4 });
    await act(cal, { op: 'offer', price: 6 });
    expect((await openListings()).filter((l) => l.kind === 'offer').map((l) => l.price)).toEqual([6]);
    setNow(2026, 10, 11);
    await sweep();
    expect(await openListings()).toHaveLength(0);
  });
});

describe('pushes', () => {
  it('costs the pusher, moves the chore, and nobody collects the cost', async () => {
    const a = await choreFor(ava, '2026-10-06', { name: 'Sweep floors' });
    await act(ava, { op: 'push', assignmentId: a.id, targetId: ben.id });
    expect(await coins(ava)).toBe(80);
    expect(await coins(ben)).toBe(100);
    expect((await assignment(a.id)).userId).toBe(ben.id);
    expect((await s.notifications.list([ben.id]))[0].kind).toBe('push_received');
  });

  it('the target can send it back for half the push cost', async () => {
    const a = await choreFor(ava, '2026-10-06', { name: 'Sweep floors' });
    await act(ava, { op: 'push', assignmentId: a.id, targetId: ben.id });
    const push = (await openListings())[0];
    await act(ben, { op: 'answerPush', listingId: push.id, reject: true });
    expect(await coins(ben)).toBe(90);
    expect(await coins(ava)).toBe(80);
    expect((await assignment(a.id)).userId).toBe(ava.id);
    // Can't be pushed again by the target, and the rejected one still counts toward Ava's limit.
    expect((await s.market.allowance(family.id, ava.id)).pushesToSend).toBe(1);
  });

  it('unanswered pushes stick, and a pushed chore cannot be pushed or sold on', async () => {
    const a = await choreFor(ava, '2026-10-06', { name: 'Sweep floors' });
    await act(ava, { op: 'push', assignmentId: a.id, targetId: ben.id });
    await expect(act(ben, { op: 'push', assignmentId: a.id, targetId: cal.id })).rejects.toThrow('already on the market or was pushed');
    await expect(act(ben, { op: 'sell', assignmentId: a.id, price: 10 })).rejects.toThrow('already on the market or was pushed');
    setNow(2026, 10, 6, 17);
    await sweep();
    expect(await openListings()).toHaveLength(0);
    await expect(act(ben, { op: 'answerPush', listingId: 'x', reject: true })).rejects.toThrow();
  });

  it('needs a day’s notice', async () => {
    const today = await choreFor(ava, '2026-10-04', { name: 'Sweep floors' });
    await expect(act(ava, { op: 'push', assignmentId: today.id, targetId: ben.id })).rejects.toThrow('a day’s notice');
  });

  it('limits each person to 2 sent and 2 received per week, parents included', async () => {
    const days = ['2026-10-05', '2026-10-06', '2026-10-07'];
    const avas = [];
    for (const d of days) avas.push(await choreFor(ava, d, { name: 'Sweep floors' }));
    await act(ava, { op: 'push', assignmentId: avas[0].id, targetId: mom.id });
    await act(ava, { op: 'push', assignmentId: avas[1].id, targetId: mom.id });
    await expect(act(ava, { op: 'push', assignmentId: avas[2].id, targetId: ben.id })).rejects.toThrow('all 2 pushes');

    const bens = await choreFor(ben, '2026-10-05', { name: 'Dishes' });
    await expect(act(ben, { op: 'push', assignmentId: bens.id, targetId: mom.id })).rejects.toThrow('Mom has already been pushed 2 times');
  });
});

describe('notifications', () => {
  it('counts unseen per device and clears when seen', async () => {
    const a = await choreFor(ben, '2026-10-05');
    await act(ben, { op: 'sell', assignmentId: a.id, price: 8 });
    expect(await s.notifications.unseenCount([ava.id])).toBe(1);
    expect(await s.notifications.unseenCount([ben.id])).toBe(0); // you don't get told about your own sale
    setNow(2026, 10, 4, 10);
    await s.notifications.markSeen();
    expect(await s.notifications.unseenCount([ava.id, mom.id, cal.id])).toBe(0);
  });
});
