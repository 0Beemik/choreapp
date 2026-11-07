import { sha256, uuid } from '../lib/crypto';
import type { Services } from '../services';
import { UserFacingError } from '../services/deps';
import { dataVersion, exportFull, exportSnapshot } from './snapshot';
import {
  PROTOCOL_VERSION,
  type ActionResult,
  type HelloResponse,
  type HandoverCommitRequest,
  type HandoverPrepareRequest,
  type HandoverPrepareResponse,
  type HttpResult,
  type MarketRequest,
  type MarketResponse,
  type PairRequest,
  type PairResponse,
  type SyncAction,
  type SyncRequest,
  type SyncResponse,
} from './protocol';

const PAIRING_TTL_MS = 10 * 60 * 1000;
/** A handover that isn't committed within this long is abandoned and the hub carries on. */
const HANDOVER_TTL_MS = 2 * 60 * 1000;
export const HANDOVER_STEP_DOWN_MS = 300;
const MAX_PAIRING_ATTEMPTS = 5;

export interface PairedDevice {
  id: string;
  name: string;
  userId: string | null;
  createdAt: string;
  lastSeenAt: string | null;
}

/** What this device needs to rejoin the family as an ordinary device after handing over. */
export interface HandedOver {
  hubId: string;
  familyName: string;
  deviceId: string;
  token: string;
}

interface PendingHandover {
  deviceId: string;
  /** The row and token this device will use once it's an ordinary family device. */
  self: HandedOver;
  expiresAt: number;
}

interface PairingCode {
  code: string;
  expiresAt: number;
  attemptsLeft: number;
}

/**
 * Runs on the family's main device. Joined devices pair once with a short code, then
 * sync by sending the chores they ticked off and receiving the family's latest data.
 * Every request is handled through the same services the hub's own screens use, so the
 * rules (points, skips, badges) are enforced in exactly one place.
 */
export class SyncHub {
  private pairing: PairingCode | null = null;
  private listeners = new Set<() => void>();
  private handover: PendingHandover | null = null;
  private handedOver = false;
  private onHandedOver: ((link: HandedOver) => Promise<void> | void) | null = null;

  constructor(
    private services: Services,
    private now: () => number = () => Date.now(),
    /** How this device appears in the family's device list after handing over. */
    private selfName = 'Previous main device',
  ) {}

  /** Called once the main-device role has moved to another device; this one then rejoins as ordinary. */
  setHandoverListener(fn: (link: HandedOver) => Promise<void> | void): void {
    this.onHandedOver = fn;
  }

  /** Notified after a device changed family data, so the hub's own screens refresh. */
  addChangeListener(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Shows a fresh 6-digit code on the hub; it works once and expires after 10 minutes. */
  newPairingCode(): { code: string; expiresAt: number } {
    const digits = String(parseInt(uuid().replace(/-/g, '').slice(0, 12), 16) % 1_000_000).padStart(6, '0');
    this.pairing = { code: digits, expiresAt: this.now() + PAIRING_TTL_MS, attemptsLeft: MAX_PAIRING_ATTEMPTS };
    return { code: digits, expiresAt: this.pairing.expiresAt };
  }

  cancelPairing(): void {
    this.pairing = null;
  }

  async devices(): Promise<PairedDevice[]> {
    const rows = await this.services.deps.db.all<{
      id: string;
      name: string;
      user_id: string | null;
      created_at: string;
      last_seen_at: string | null;
    }>('SELECT * FROM paired_devices ORDER BY created_at');
    return rows.map((r) => ({ id: r.id, name: r.name, userId: r.user_id, createdAt: r.created_at, lastSeenAt: r.last_seen_at }));
  }

  async removeDevice(id: string): Promise<void> {
    await this.services.deps.db.run('DELETE FROM paired_devices WHERE id = ?', [id]);
  }

  /** Entry point for every request from the network. Never throws. */
  async handle(path: string, body: unknown): Promise<HttpResult> {
    try {
      // Moved away: devices get "unavailable" and go looking for the new main device.
      if (this.handedOver) return { status: 503, body: { error: 'The main device has moved.' } };
      // A move that never committed is abandoned; nothing here changed, so just carry on.
      if (this.handover && this.now() > this.handover.expiresAt) this.handover = null;
      // Mid-handover, nothing may change here or it would be lost in the copy; devices retry shortly.
      if (this.handover && path !== '/handover/commit' && path !== '/hello') {
        return { status: 503, body: { error: 'The main device is moving. Try again in a moment.' } };
      }
      switch (path) {
        case '/hello':
          return { status: 200, body: await this.hello() };
        case '/pair':
          return await this.pair(body as PairRequest);
        case '/sync':
          return await this.sync(body as SyncRequest);
        case '/market':
          return await this.market(body as MarketRequest);
        case '/handover/prepare':
          return await this.prepareHandover(body as HandoverPrepareRequest);
        case '/handover/commit':
          return await this.commitHandover(body as HandoverCommitRequest);
        default:
          return { status: 404, body: { error: 'not found' } };
      }
    } catch (e) {
      console.warn('Sync request failed', e);
      return { status: 500, body: { error: 'hub error' } };
    }
  }

  private async hello(): Promise<HelloResponse> {
    const family = await this.services.family.current();
    return { protocol: PROTOCOL_VERSION, hubId: family?.id ?? '', familyName: family?.name ?? '' };
  }

  private async pair(req: PairRequest): Promise<HttpResult> {
    const p = this.pairing;
    if (!p || this.now() > p.expiresAt) {
      return { status: 403, body: { error: 'No pairing code is showing on the main device. Open Devices → Add a device there.' } };
    }
    if (typeof req?.code !== 'string' || req.code !== p.code) {
      p.attemptsLeft--;
      if (p.attemptsLeft <= 0) this.pairing = null;
      return { status: 403, body: { error: 'That code isn’t right. Check the main device and try again.' } };
    }
    this.pairing = null; // single use

    const family = await this.services.family.current();
    if (!family) return { status: 409, body: { error: 'The main device has no family set up yet.' } };

    const token = `${uuid()}${uuid()}`.replace(/-/g, '');
    const deviceId = uuid();
    const name = String(req.deviceName ?? 'Device').slice(0, 60) || 'Device';
    await this.services.deps.db.run(
      'INSERT INTO paired_devices (id, name, token_hash, user_id, created_at, last_seen_at) VALUES (?, ?, ?, NULL, ?, ?)',
      [deviceId, name, await sha256(token), this.services.deps.timestamp(), this.services.deps.timestamp()],
    );
    const res: PairResponse = { hubId: family.id, deviceId, token, snapshot: await exportSnapshot(this.services.deps.db) };
    return { status: 200, body: res };
  }

  /**
   * Step 1: check the PIN and hand over a full copy. Nothing changes here yet: in the copy, the
   * requester is no longer a paired device (it becomes the hub) and this device is one.
   */
  private async prepareHandover(req: HandoverPrepareRequest): Promise<HttpResult> {
    const device = await this.deviceFor(req?.token);
    if (!device) return { status: 401, body: { error: 'This device was removed from the family.' } };
    const family = await this.services.family.current();
    if (!family) return { status: 409, body: { error: 'No family on the main device.' } };
    if (typeof req.pin !== 'string' || !(await this.services.family.verifyPin(family.id, req.pin))) {
      return { status: 403, body: { error: 'That PIN isn’t right.' } };
    }
    const token = `${uuid()}${uuid()}`.replace(/-/g, '');
    const self: HandedOver = { hubId: family.id, familyName: family.name, deviceId: uuid(), token };
    const now = this.services.deps.timestamp();
    const full = await exportFull(this.services.deps.db);
    full.tables.paired_devices = [
      ...(full.tables.paired_devices ?? []).filter((r) => r.id !== device.id),
      { id: self.deviceId, name: this.selfName, token_hash: await sha256(token), user_id: null, created_at: now, last_seen_at: now },
    ];
    this.handover = { deviceId: device.id, self, expiresAt: this.now() + HANDOVER_TTL_MS };
    const res: HandoverPrepareResponse = { hubId: family.id, familyName: family.name, full };
    return { status: 200, body: res };
  }

  /** Step 2: the new main device has saved everything. Stop serving and rejoin as an ordinary device. */
  private async commitHandover(req: HandoverCommitRequest): Promise<HttpResult> {
    const pending = this.handover;
    const device = await this.deviceFor(req?.token);
    if (!pending || !device || device.id !== pending.deviceId) {
      return { status: 409, body: { error: 'No move in progress. Start again.' } };
    }
    this.handover = null;
    this.handedOver = true;
    // Step down only after this reply is on its way: stepping down stops the server, and a lost
    // reply would leave the new device thinking the move failed while this one had already left.
    setTimeout(() => {
      Promise.resolve(this.onHandedOver?.(pending.self)).catch((e) => console.warn('Handover rejoin failed', e));
    }, HANDOVER_STEP_DOWN_MS);
    return { status: 200, body: { ok: true } };
  }

  private async deviceFor(token: unknown): Promise<{ id: string; user_id: string | null } | null> {
    return this.services.deps.db.get<{ id: string; user_id: string | null }>(
      'SELECT id, user_id FROM paired_devices WHERE token_hash = ?',
      [await sha256(String(token ?? ''))],
    );
  }

  private async market(req: MarketRequest): Promise<HttpResult> {
    const { db } = this.services.deps;
    const device = await this.deviceFor(req?.token);
    if (!device) return { status: 401, body: { error: 'This device was removed from the family.' } };
    const family = await this.services.family.current();
    if (!family) return { status: 409, body: { error: 'No family on the main device.' } };

    let ok = true;
    let message: string | null = null;
    try {
      // A kid's phone can only act as that kid; a shared device can act for anyone, like the main device.
      if (device.user_id && req.actorId !== device.user_id) throw new UserFacingError('This device can only trade for its owner.');
      await this.services.rotation.ensureCurrentPeriod(family.id);
      await this.services.market.perform(family.id, String(req.actorId ?? ''), req.op);
      await this.services.market.sweep(family.id);
    } catch (e) {
      if (!(e instanceof UserFacingError)) throw e;
      ok = false;
      message = e.message;
    }
    await db.run('UPDATE paired_devices SET last_seen_at = ? WHERE id = ?', [this.services.deps.timestamp(), device.id]);
    if (ok) this.listeners.forEach((fn) => fn());
    const res: MarketResponse = { ok, message, snapshot: await exportSnapshot(db) };
    return { status: 200, body: res };
  }

  private async sync(req: SyncRequest): Promise<HttpResult> {
    const { db } = this.services.deps;
    const device = await this.deviceFor(req?.token);
    if (!device) return { status: 401, body: { error: 'This device was removed from the family.' } };

    // A device can be tied to one kid once (right after pairing). After that only a parent
    // can change it, by removing and re-adding the device, so kids can't switch to a sibling.
    let userId = device.user_id;
    if (!userId && req.userId) {
      const member = await this.services.deps.repos.users.findById(req.userId);
      if (member) userId = member.id;
    }
    await db.run('UPDATE paired_devices SET last_seen_at = ?, user_id = ? WHERE id = ?', [
      this.services.deps.timestamp(),
      userId,
      device.id,
    ]);

    const family = await this.services.family.current();
    if (family) await this.services.rotation.ensureCurrentPeriod(family.id);

    const results: ActionResult[] = [];
    let changed = false;
    for (const action of Array.isArray(req.actions) ? req.actions.slice(0, 200) : []) {
      const r = await this.apply(device.id, userId, action);
      if (r) {
        results.push(r);
        changed ||= r.ok;
      }
    }
    // Chores just ticked off may settle held market coins.
    if (changed && family) await this.services.market.sweep(family.id);
    if (changed) this.listeners.forEach((fn) => fn());

    // A refused action changes nothing here, but the device already showed it locally,
    // so it needs the real data back to undo that.
    const refused = results.some((r) => !r.ok);
    const upToDate = !refused && (await dataVersion(db)) === req.knownVersion;
    const res: SyncResponse = { results, snapshot: upToDate ? null : await exportSnapshot(db) };
    return { status: 200, body: res };
  }

  /** Applies one action exactly once. Returns null if it should be retried later. */
  private async apply(deviceId: string, userId: string | null, a: SyncAction): Promise<ActionResult | null> {
    const { db } = this.services.deps;
    if (!a || typeof a.id !== 'string' || typeof a.assignmentId !== 'string') return null;

    const seen = await db.get<{ ok: number; message: string | null }>('SELECT ok, message FROM applied_actions WHERE id = ?', [a.id]);
    if (seen) return { id: a.id, ok: seen.ok === 1, message: seen.message };

    let ok = true;
    let message: string | null = null;
    try {
      const assignment = await this.services.deps.repos.assignments.findById(a.assignmentId);
      if (!assignment) throw new UserFacingError('That chore no longer exists.');
      // A kid's phone can only tick off that kid's own chores.
      if (userId && assignment.userId !== userId) throw new UserFacingError('That chore belongs to someone else.');
      const at = parseLocal(a.at);
      if (a.type === 'complete') await this.services.chores.complete(a.assignmentId, at);
      else if (a.type === 'skip') await this.services.chores.buyout(a.assignmentId, at);
      else if (a.type === 'undo') await this.services.chores.undo(a.assignmentId);
      else throw new UserFacingError('Unknown action.');
    } catch (e) {
      if (!(e instanceof UserFacingError)) return null; // unexpected: let the device retry
      ok = false;
      message = e.message;
    }
    await db.run('INSERT INTO applied_actions (id, device_id, ok, message, applied_at) VALUES (?, ?, ?, ?, ?)', [
      a.id,
      deviceId,
      ok ? 1 : 0,
      message,
      this.services.deps.timestamp(),
    ]);
    return { id: a.id, ok, message };
  }
}

/** 'YYYY-MM-DDTHH:mm:ss' local → Date (undefined if malformed). */
export function parseLocal(ts: unknown): Date | undefined {
  if (typeof ts !== 'string') return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(ts);
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi, s);
}
