import { createServices, type Services } from '../services';
import { STARTER_CHORES } from '../lib/presets';
import { NodeDb } from '../testing/nodeDb';
import type { Family, User } from '../models';
import type { HubTransport } from './protocol';
import { SyncHub } from './SyncHub';
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
    await hubSvc.chores.add(family.id, { name: 'Walk dog', icon: '🐕', frequency: 'daily', points: 5, fixedUserId: ava.id });
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
