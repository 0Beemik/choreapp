import { createServices, type Services } from '../services';
import { STARTER_CHORES } from '../lib/presets';
import { NodeDb } from '../testing/nodeDb';
import type { Family, User } from '../models';
import type { HubTransport } from './protocol';
import { HANDOVER_STEP_DOWN_MS, SyncHub } from './SyncHub';
import { SyncMember } from './SyncMember';

const HUB_ADDR = '192.168.1.20:47821';

let now: Date;
const setNow = (y: number, m: number, d: number, h = 9) => {
  now = new Date(y, m - 1, d, h);
};

let hubSvc: Services;
let phoneSvc: Services;
let hub: SyncHub;
let phone: SyncMember;
let family: Family;
let ava: User;
let ben: User;
let online: boolean;
let hubAddress: string;
let requests: { path: string; body: unknown }[];

/** Simulates home Wi-Fi: JSON over the "wire", unreachable when offline. */
const wifi: HubTransport = {
  async post(address, path, body) {
    if (!online || address !== hubAddress) throw new Error('ECONNREFUSED');
    const wire = JSON.parse(JSON.stringify(body));
    requests.push({ path, body: wire });
    const res = await hub.handle(path, wire);
    return JSON.parse(JSON.stringify(res));
  },
};

async function balance(s: Services, u: User) {
  return (await s.points.balances(family.id))[u.id] ?? 0;
}

async function boardFor(s: Services, u: User) {
  await s.rotation.ensureCurrentPeriod(family.id);
  return (await s.board.load(family.id))!.byUser[u.id] ?? [];
}

async function pairPhone() {
  const { code } = hub.newPairingCode();
  await phone.join(HUB_ADDR, code, 'Ava’s phone');
}

beforeEach(async () => {
  setNow(2026, 10, 4); // Sunday
  online = true;
  hubAddress = HUB_ADDR;
  requests = [];
  hubSvc = await createServices(new NodeDb(), () => now);
  phoneSvc = await createServices(new NodeDb(), () => now);
  hub = new SyncHub(hubSvc, () => now.getTime());
  phone = new SyncMember(phoneSvc, wifi, async () => hubAddress);

  family = await hubSvc.family.setup({
    familyName: 'The Testers',
    parent: { name: 'Mom', age: 0, role: 'parent' },
    pin: '1234',
    kids: [
      { name: 'Ava', age: 9, role: 'child' },
      { name: 'Ben', age: 6, role: 'child' },
    ],
    chores: STARTER_CHORES.filter((c) => c.name === 'Make your bed' || c.name === 'Take out the trash'),
  });
  const members = await hubSvc.family.members(family.id);
  ava = members.find((m) => m.name === 'Ava')!;
  ben = members.find((m) => m.name === 'Ben')!;
});

describe('pairing', () => {
  it('copies the family to the new device with a one-time code', async () => {
    await pairPhone();
    expect((await phoneSvc.family.current())?.name).toBe('The Testers');
    expect((await phoneSvc.family.members(family.id)).map((m) => m.name)).toEqual(['Ava', 'Ben', 'Mom']);
    expect(await boardFor(phoneSvc, ava)).toEqual(await boardFor(hubSvc, ava));
    expect((await hub.devices()).map((d) => d.name)).toEqual(['Ava’s phone']);
  });

  it('never sends the parent PIN to other devices', async () => {
    await pairPhone();
    const row = await phoneSvc.deps.db.get<{ pin_hash: string }>('SELECT pin_hash FROM families');
    expect(row?.pin_hash).toBe('');
    expect(await phoneSvc.family.verifyPin(family.id, '1234')).toBe(false);
  });

  it('rejects wrong, reused, expired and brute-forced codes', async () => {
    await expect(phone.join(HUB_ADDR, '000000', 'x')).rejects.toThrow('No pairing code');

    const { code } = hub.newPairingCode();
    const wrong = code === '111111' ? '222222' : '111111';
    await expect(phone.join(HUB_ADDR, wrong, 'x')).rejects.toThrow('isn’t right');
    await phone.join(HUB_ADDR, code, 'x');
    await expect(new SyncMember(phoneSvc, wifi).join(HUB_ADDR, code, 'y')).rejects.toThrow('No pairing code');

    const second = hub.newPairingCode();
    now = new Date(now.getTime() + 11 * 60 * 1000);
    await expect(phone.join(HUB_ADDR, second.code, 'x')).rejects.toThrow('No pairing code');

    const third = hub.newPairingCode();
    for (let i = 0; i < 5; i++) await phone.join(HUB_ADDR, third.code === '999999' ? '888888' : '999999', 'x').catch(() => undefined);
    await expect(phone.join(HUB_ADDR, third.code, 'x')).rejects.toThrow('No pairing code');
  });

  it('explains when the main device can’t be reached', async () => {
    online = false;
    await expect(phone.join(HUB_ADDR, '123456', 'x')).rejects.toThrow('same Wi-Fi');
  });
});

describe('syncing chores', () => {
  beforeEach(pairPhone);

  async function avasChore() {
    const kid = (await boardFor(hubSvc, ava)).length ? ava : ben;
    return { kid, assignment: (await boardFor(phoneSvc, kid))[0] };
  }

  it('applies a tap instantly on the phone and on the hub after sync', async () => {
    const { kid, assignment } = await avasChore();
    const result = await phone.act('complete', assignment.id);
    expect(result?.pointsAwarded).toBe(10);
    expect(await balance(phoneSvc, kid)).toBe(15); // includes First Step badge, shown on the phone now
    expect(await balance(hubSvc, kid)).toBe(0);

    expect((await phone.sync()).status).toBe('synced');
    expect(await balance(hubSvc, kid)).toBe(15);
    expect(await balance(phoneSvc, kid)).toBe(15);
    expect(await phone.pendingCount()).toBe(0);
    // Coins travel the same way.
    expect(result?.coinsAwarded).toBe(2);
    expect(await hubSvc.coins.balance(kid.id)).toBe(2);
    expect(await phoneSvc.coins.balance(kid.id)).toBe(2);
  });

  it('keeps taps made away from home and sends them later', async () => {
    const { kid, assignment } = await avasChore();
    online = false;
    await phone.act('complete', assignment.id);
    expect((await phone.sync()).status).toBe('offline');
    expect(await phone.pendingCount()).toBe(1);
    expect(await balance(phoneSvc, kid)).toBe(15);

    online = true;
    await phone.sync();
    expect(await balance(hubSvc, kid)).toBe(15);
  });

  it('counts a chore done on time even if it reaches the hub the next day', async () => {
    const { kid, assignment } = await avasChore();
    setNow(2026, 10, 4, 19);
    online = false;
    await phone.act('complete', assignment.id);

    setNow(2026, 10, 5, 8); // hub closes Sunday first: missed + penalty
    await hubSvc.rotation.ensureCurrentPeriod(family.id);
    expect((await hubSvc.deps.repos.assignments.findById(assignment.id))?.status).toBe(
      assignment.dueDate === '2026-10-04' ? 'missed' : 'pending',
    );

    online = true;
    await phone.sync();
    const onHub = await hubSvc.deps.repos.assignments.findById(assignment.id);
    expect(onHub?.status).toBe('completed');
    expect(onHub?.completedAt?.startsWith('2026-10-04T19')).toBe(true);
    expect((await hubSvc.points.history(kid.id)).some((t) => t.type === 'penalty')).toBe(false);
  });

  it('never double-counts when a reply is lost and the phone retries', async () => {
    const { kid, assignment } = await avasChore();
    await phone.act('complete', assignment.id);
    const [action] = await phoneSvc.deps.db.all<{ payload: string }>('SELECT payload FROM sync_outbox');
    // The hub got the request but the phone never saw the answer.
    await hub.handle('/sync', { token: (await phone.link())!.token, knownVersion: -1, actions: [JSON.parse(action.payload)] });
    await phone.sync();
    expect(await balance(hubSvc, kid)).toBe(15);
  });

  it('sends undo and skip too', async () => {
    const { kid, assignment } = await avasChore();
    await phone.act('complete', assignment.id);
    await phone.act('undo', assignment.id);
    await phone.sync();
    expect((await hubSvc.deps.repos.assignments.findById(assignment.id))?.status).toBe('pending');

    await hubSvc.points.adjust(family.id, kid.id, 50, 'gift');
    await phone.sync();
    await phone.act('skip', assignment.id);
    await phone.sync();
    expect((await hubSvc.deps.repos.assignments.findById(assignment.id))?.status).toBe('bought_out');
  });

  it('only lets a kid’s phone tick off that kid’s chores', async () => {
    await phone.setUser(ava.id);
    await phone.sync();
    const bens = await boardFor(phoneSvc, ben);
    const target = bens[0] ?? (await boardFor(phoneSvc, ava))[0];
    if (target.userId === ava.id) return; // rotation gave Ava everything this week
    await phone.act('complete', target.id);
    const outcome = await phone.sync();
    expect(outcome.rejected[0]?.message).toContain('someone else');
    expect(await balance(hubSvc, ben)).toBe(0);
    expect(await balance(phoneSvc, ben)).toBe(0); // the phone corrects itself from the hub
  });

  it('won’t let a kid’s phone switch itself to a sibling', async () => {
    await phone.setUser(ava.id);
    await phone.sync();
    await phone.setUser(ben.id);
    await phone.sync();
    const [d] = await hub.devices();
    expect(d.userId).toBe(ava.id);
  });

  it('brings parent changes on the hub to the phone', async () => {
    await hubSvc.chores.add(family.id, { name: 'Walk dog', icon: '🐕', frequency: 'daily', points: 5, assigneeIds: [ava.id], timeOfDay: 'any', coins: 2 });
    await phone.sync();
    expect((await phoneSvc.chores.list(family.id)).map((c) => c.name)).toContain('Walk dog');
  });

  it('skips the download when nothing changed', async () => {
    await phone.sync();
    requests = [];
    await phone.sync();
    const reply = await hub.handle('/sync', requests[0].body);
    expect((reply.body as { snapshot: unknown }).snapshot).toBeNull();
  });

  it('finds the hub again after its address changes', async () => {
    hubAddress = '192.168.1.57:47821';
    expect((await phone.sync()).status).toBe('synced');
    expect((await phone.link())?.address).toBe('192.168.1.57:47821');
  });

  it('stops syncing once a parent removes the device', async () => {
    const [d] = await hub.devices();
    await hub.removeDevice(d.id);
    expect((await phone.sync()).status).toBe('removed');
  });
});

describe('marketplace over Wi-Fi', () => {
  beforeEach(pairPhone);

  async function bensMondayChore() {
    const chore = await hubSvc.chores.add(family.id, { name: 'Dishes', icon: '🍽️', frequency: 'daily', points: null, assigneeIds: [ben.id], timeOfDay: 'evening', coins: 2 });
    await phone.sync();
    const week = await hubSvc.deps.repos.assignments.findByPeriod(family.id, '2026-10-04');
    return week.find((a) => a.choreId === chore.id && a.dueDate === '2026-10-05')!;
  }

  it('a phone posts and buys through the main device, and both see the result', async () => {
    const a = await bensMondayChore();
    await hubSvc.coins.adjust(family.id, ben.id, 20, 'gift');
    await hubSvc.market.perform(family.id, ben.id, { op: 'sell', assignmentId: a.id, price: 6 });
    await phone.sync();

    await phone.setUser(ava.id);
    const sale = (await phoneSvc.market.overview(family.id)).open[0];
    await phone.market(ava.id, { op: 'buy', listingId: sale.id });
    expect((await hubSvc.deps.repos.assignments.findById(a.id))?.userId).toBe(ava.id);
    expect((await phoneSvc.deps.repos.assignments.findById(a.id))?.userId).toBe(ava.id);
    expect((await phoneSvc.notifications.list([ben.id]))[0].kind).toBe('sale_bought');
  });

  it('a kid’s phone can only trade as that kid, and refusals come back as messages', async () => {
    const a = await bensMondayChore();
    await phone.setUser(ava.id);
    await phone.sync(); // binds the phone to Ava on the hub
    await expect(phone.market(ben.id, { op: 'sell', assignmentId: a.id, price: 6 })).rejects.toThrow('only trade for its owner');
    await expect(phone.market(ava.id, { op: 'sell', assignmentId: a.id, price: 6 })).rejects.toThrow('isn’t yours');
  });

  it('needs home Wi-Fi', async () => {
    online = false;
    await expect(phone.market(ava.id, { op: 'offer', price: 3 })).rejects.toThrow('home Wi-Fi');
  });

  it('pays out held coins when the buyer ticks it off on their phone', async () => {
    const a = await bensMondayChore();
    await hubSvc.coins.adjust(family.id, ben.id, 20, 'gift');
    await hubSvc.market.perform(family.id, ben.id, { op: 'sell', assignmentId: a.id, price: 6 });
    await phone.setUser(ava.id);
    await phone.sync();
    await phone.market(ava.id, { op: 'buy', listingId: (await phoneSvc.market.overview(family.id)).open[0].id });

    setNow(2026, 10, 5, 18);
    await phone.act('complete', a.id);
    await phone.sync();
    expect(await hubSvc.coins.balance(ava.id)).toBe(2 + 6);
    expect(await phoneSvc.coins.balance(ava.id)).toBe(2 + 6);
  });
});

describe('moving the main device', () => {
  const TABLET_ADDR = '192.168.1.30:47821';
  let routes: Map<string, SyncHub>;
  /** Home Wi-Fi with several devices on it. */
  const net: HubTransport = {
    async post(address, path, body) {
      const target = routes.get(address);
      if (!target) throw new Error('ECONNREFUSED');
      return JSON.parse(JSON.stringify(await target.handle(path, JSON.parse(JSON.stringify(body)))));
    },
  };
  const settle = () => new Promise((r) => setTimeout(r, HANDOVER_STEP_DOWN_MS + 50));

  let kidSvc: Services;
  let kid: SyncMember;
  let oldHubAsMember: SyncMember;

  beforeEach(async () => {
    await pairPhone(); // the "tablet"
    routes = new Map([[HUB_ADDR, hub]]);
    kidSvc = await createServices(new NodeDb(), () => now);
    kid = new SyncMember(kidSvc, net, async () => TABLET_ADDR);
    const { code } = hub.newPairingCode();
    await kid.join(HUB_ADDR, code, 'Ben’s phone');
    await kid.setUser(ben.id);
    await kid.sync();
    oldHubAsMember = new SyncMember(hubSvc, net, async () => TABLET_ADDR);
    hub.setHandoverListener((link) => oldHubAsMember.adopt(link));
  });

  it('needs the parent PIN, and a wrong one changes nothing', async () => {
    await expect(phone.becomeMainDevice('9999')).rejects.toThrow('PIN isn’t right');
    expect(await phone.link()).not.toBeNull();
    expect((await kid.sync()).status).toBe('synced'); // the old main device still serves
  });

  it('moves everything; the old main device and every phone carry on with the new one', async () => {
    await hubSvc.coins.adjust(family.id, ben.id, 15, 'Allowance');
    await phone.becomeMainDevice('1234');

    // The tablet is now the hub: no link, the family's PIN works here, the old hub is a paired device.
    expect(await phone.link()).toBeNull();
    expect(await phoneSvc.family.verifyPin(family.id, '1234')).toBe(true);
    expect(await phoneSvc.coins.balance(ben.id)).toBe(15);
    const tabletHub = new SyncHub(phoneSvc, () => now.getTime());
    const devices = await tabletHub.devices();
    expect(devices.map((d) => d.name).sort()).toEqual(['Ben’s phone', 'Previous main device']);
    routes.set(TABLET_ADDR, tabletHub);

    // The old hub steps down and rejoins as an ordinary device.
    await settle();
    expect((await hub.handle('/hello', {})).status).toBe(503);
    expect((await oldHubAsMember.sync()).status).toBe('synced');
    expect((await oldHubAsMember.link())?.address).toBe(TABLET_ADDR);

    // Ben's phone, paired before the move, finds the new main device on its own.
    const [mine] = await boardFor(kidSvc, ben).then((b) => (b.length ? b : boardFor(kidSvc, ava)));
    await kid.act('complete', mine.id);
    expect((await kid.sync()).status).toBe('synced');
    expect((await kid.link())?.address).toBe(TABLET_ADDR);
    expect((await phoneSvc.deps.repos.assignments.findById(mine.id))?.status).toBe('completed');
  });

  it('pauses changes mid-move and carries on if the move never finishes', async () => {
    const link = (await phone.link())!;
    const prep = await hub.handle('/handover/prepare', { token: link.token, pin: '1234' });
    expect(prep.status).toBe(200);
    expect((await kid.sync()).status).toBe('offline'); // refused while moving; it will retry
    now = new Date(now.getTime() + 3 * 60 * 1000); // abandoned
    routes.delete(TABLET_ADDR);
    kid = new SyncMember(kidSvc, net, async () => HUB_ADDR);
    expect((await kid.sync()).status).toBe('synced');
  });
});
