import { sha256, uuid } from '../lib/crypto';
import type { Services } from '../services';
import { UserFacingError } from '../services/deps';
import { dataVersion, exportSnapshot } from './snapshot';
import {
  PROTOCOL_VERSION,
  type ActionResult,
  type HelloResponse,
  type HttpResult,
  type PairRequest,
  type PairResponse,
  type SyncAction,
  type SyncRequest,
  type SyncResponse,
} from './protocol';

const PAIRING_TTL_MS = 10 * 60 * 1000;
const MAX_PAIRING_ATTEMPTS = 5;

export interface PairedDevice {
  id: string;
  name: string;
  userId: string | null;
  createdAt: string;
  lastSeenAt: string | null;
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

  constructor(
    private services: Services,
    private now: () => number = () => Date.now(),
  ) {}

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
      switch (path) {
        case '/hello':
          return { status: 200, body: await this.hello() };
        case '/pair':
          return await this.pair(body as PairRequest);
        case '/sync':
          return await this.sync(body as SyncRequest);
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

  private async sync(req: SyncRequest): Promise<HttpResult> {
    const { db } = this.services.deps;
    const device = await db.get<{ id: string; user_id: string | null }>(
      'SELECT id, user_id FROM paired_devices WHERE token_hash = ?',
      [await sha256(String(req?.token ?? ''))],
    );
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
