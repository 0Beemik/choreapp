import { uuid } from '../lib/crypto';
import { SerialQueue } from '../lib/SerialQueue';
import type { Services } from '../services';
import type { CompletionResult } from '../services/ChoreService';
import type { MarketOp } from '../services/MarketService';
import { UserFacingError } from '../services/deps';
import { parseLocal } from './SyncHub';
import { importFull, importSnapshot } from './snapshot';
import {
  PROTOCOL_VERSION,
  type ActionType,
  type HelloResponse,
  type HandoverPrepareResponse,
  type HubTransport,
  type MarketResponse,
  type PairResponse,
  type SyncAction,
  type SyncResponse,
} from './protocol';

export interface MemberLink {
  hubId: string;
  familyName: string;
  address: string;
  token: string;
  deviceId: string;
  /** Family member who uses this device; null shows every kid. */
  userId: string | null;
  knownVersion: number;
  lastSyncAt: string | null;
}

export type SyncStatus = 'synced' | 'offline' | 'removed';

export interface SyncOutcome {
  status: SyncStatus;
  /** Actions the hub refused (e.g. a parent already excused that chore). */
  rejected: { action: SyncAction; message: string }[];
}

const LINK_KEY = 'member_link';

/** Finds the hub's current address on the home network, if it moved. */
export type HubFinder = (hubId: string) => Promise<string | null>;

/**
 * Runs on a joined device. Kids' taps are applied to the local copy straight away (so the
 * board and celebrations feel instant, even away from home) and queued for the hub.
 * Each sync sends the queue and replaces the local copy with the hub's authoritative data.
 */
export class SyncMember {
  private queue = new SerialQueue();

  constructor(
    private services: Services,
    private transport: HubTransport,
    private findHub: HubFinder = async () => null,
  ) {}

  async link(): Promise<MemberLink | null> {
    const raw = await this.services.deps.repos.appState.get(LINK_KEY);
    return raw ? (JSON.parse(raw) as MemberLink) : null;
  }

  private saveLink(link: MemberLink): Promise<void> {
    return this.services.deps.repos.appState.set(LINK_KEY, JSON.stringify(link));
  }

  /** Checks an address really is a family hub before asking for a code. */
  async probe(address: string): Promise<HelloResponse> {
    const res = await this.transport.post(address, '/hello', {}).catch(() => null);
    const hello = res?.body as HelloResponse | undefined;
    if (!res || res.status !== 200 || !hello?.hubId) {
      throw new UserFacingError('Couldn’t reach the main device. Make sure both are on the same Wi-Fi and the app is open there.');
    }
    if (hello.protocol !== PROTOCOL_VERSION) {
      throw new UserFacingError('The two devices are on different app versions. Update both from the Play Store.');
    }
    return hello;
  }

  async join(address: string, code: string, deviceName: string): Promise<MemberLink> {
    const hello = await this.probe(address);
    const res = await this.transport.post(address, '/pair', { code: code.trim(), deviceName });
    if (res.status !== 200) {
      throw new UserFacingError((res.body as { error?: string })?.error ?? 'Pairing failed. Try a new code.');
    }
    const pair = res.body as PairResponse;
    await importSnapshot(this.services.deps.db, pair.snapshot);
    const link: MemberLink = {
      hubId: pair.hubId,
      familyName: hello.familyName,
      address,
      token: pair.token,
      deviceId: pair.deviceId,
      userId: null,
      knownVersion: pair.snapshot.version,
      lastSyncAt: this.services.deps.timestamp(),
    };
    await this.saveLink(link);
    return link;
  }

  async setUser(userId: string | null): Promise<void> {
    const link = await this.link();
    if (link) await this.saveLink({ ...link, userId });
  }

  /** Tick off / undo / skip a chore on this device. Applies locally now, syncs later. */
  async act(type: ActionType, assignmentId: string): Promise<CompletionResult | null> {
    const at = this.services.deps.clock();
    const result = await this.applyLocally(type, assignmentId, at);
    const action: SyncAction = { id: uuid(), type, assignmentId, at: this.services.deps.timestamp() };
    await this.services.deps.db.run('INSERT INTO sync_outbox (id, payload, created_at) VALUES (?, ?, ?)', [
      action.id,
      JSON.stringify(action),
      action.at,
    ]);
    return result;
  }

  /** Rejoin as an ordinary device after this device handed the main role to another. */
  async adopt(link: { hubId: string; familyName: string; deviceId: string; token: string }): Promise<void> {
    // Address unknown until found on the network; the first sync looks the hub up by id.
    await this.saveLink({ ...link, address: '', userId: null, knownVersion: -1, lastSyncAt: null });
  }

  /**
   * Makes this device the family's main device: the current one checks the parent PIN and sends
   * everything; once it's saved here, the old one steps down. Needs home Wi-Fi.
   */
  becomeMainDevice(pin: string): Promise<void> {
    return this.queue.run(async () => {
      if (!(await this.link())) throw new UserFacingError('This device isn’t part of a family.');
      await this.syncOnce(); // send any waiting taps first so nothing is left behind
      const link = (await this.link())!;
      const offline = 'Connect to your home Wi-Fi, with the main device on, and try again.';
      const res = await this.transport.post(link.address, '/handover/prepare', { token: link.token, pin }).catch(() => null);
      if (!res) throw new UserFacingError(offline);
      if (res.status !== 200) throw new UserFacingError((res.body as { error?: string })?.error ?? offline);
      const prep = res.body as HandoverPrepareResponse;
      await importFull(this.services.deps.db, prep.full);
      // Only step up once the old main device has stepped down; otherwise stay as we were.
      const done = await this.transport.post(link.address, '/handover/commit', { token: link.token }).catch(() => null);
      if (!done || done.status !== 200) {
        throw new UserFacingError('The move didn’t finish, so nothing changed. Try again.');
      }
      const { db } = this.services.deps;
      await db.transaction(async () => {
        await db.run('DELETE FROM sync_outbox');
        await db.run(`DELETE FROM app_state WHERE key = ?`, [LINK_KEY]);
      });
    });
  }

  /** Market moves need the hub's say-so, so they only work on home Wi-Fi. */
  market(actorId: string, op: MarketOp): Promise<void> {
    return this.queue.run(async () => {
      let link = await this.link();
      if (!link) throw new UserFacingError('This device isn’t part of a family.');
      // Send any waiting chore taps first, so the hub judges the move on up-to-date data.
      await this.syncOnce();
      link = (await this.link())!;
      const res = await this.transport.post(link.address, '/market', { token: link.token, actorId, op }).catch(() => null);
      if (!res || (res.status !== 200 && res.status !== 401)) {
        throw new UserFacingError('Connect to your home Wi-Fi (with the main device on) to use the marketplace.');
      }
      if (res.status === 401) throw new UserFacingError('This device was removed from the family.');
      const reply = res.body as MarketResponse;
      const { db } = this.services.deps;
      await db.transaction(async () => {
        await importSnapshot(db, reply.snapshot);
        for (const a of await this.outbox()) {
          await this.applyLocally(a.type, a.assignmentId, parseLocal(a.at)).catch(() => undefined);
        }
      });
      await this.saveLink({ ...link, knownVersion: reply.snapshot.version, lastSyncAt: this.services.deps.timestamp() });
      if (!reply.ok) throw new UserFacingError(reply.message ?? 'The main device said no.');
    });
  }

  async pendingCount(): Promise<number> {
    const row = await this.services.deps.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox');
    return row?.n ?? 0;
  }

  sync(): Promise<SyncOutcome> {
    return this.queue.run(() => this.syncOnce());
  }

  /** Forget the family on this device (the hub can also remove it from its side). */
  async leave(): Promise<void> {
    const { db } = this.services.deps;
    await db.transaction(async () => {
      await db.run('DELETE FROM sync_outbox');
      await db.run(`DELETE FROM app_state WHERE key = ?`, [LINK_KEY]);
      await this.services.deps.repos.families.deleteAll();
    });
  }

  private async syncOnce(): Promise<SyncOutcome> {
    let link = await this.link();
    if (!link) return { status: 'removed', rejected: [] };
    const outbox = await this.outbox();
    const body = { token: link.token, knownVersion: link.knownVersion, actions: outbox, userId: link.userId };

    let res = await this.transport.post(link.address, '/sync', body).catch(() => null);
    // Unreachable, or "the main device has moved": look for the hub by id (it may be a new device now).
    if (!res || res.status === 503) {
      // The hub may have a new address after a router restart; look for it by id.
      const found = await this.findHub(link.hubId).catch(() => null);
      if (found && found !== link.address) {
        link = { ...link, address: found };
        await this.saveLink(link);
        res = await this.transport.post(link.address, '/sync', body).catch(() => null);
      }
    }
    if (!res) return { status: 'offline', rejected: [] };
    if (res.status === 401) return { status: 'removed', rejected: [] };
    if (res.status !== 200) return { status: 'offline', rejected: [] };

    const reply = res.body as SyncResponse;
    const answered = new Map(reply.results.map((r) => [r.id, r]));
    const rejected = outbox
      .filter((a) => answered.get(a.id)?.ok === false)
      .map((a) => ({ action: a, message: answered.get(a.id)?.message ?? 'Not accepted' }));

    const { db } = this.services.deps;
    await db.transaction(async () => {
      for (const id of answered.keys()) await db.run('DELETE FROM sync_outbox WHERE id = ?', [id]);
      if (reply.snapshot) {
        await importSnapshot(db, reply.snapshot);
        link = { ...link!, knownVersion: reply.snapshot.version };
        // Anything still queued (tapped mid-sync, or for the hub to retry) stays visible.
        for (const a of await this.outbox()) {
          await this.applyLocally(a.type, a.assignmentId, parseLocal(a.at)).catch(() => undefined);
        }
      }
    });
    await this.saveLink({ ...link!, lastSyncAt: this.services.deps.timestamp() });
    return { status: 'synced', rejected };
  }

  private async outbox(): Promise<SyncAction[]> {
    const rows = await this.services.deps.db.all<{ payload: string }>('SELECT payload FROM sync_outbox ORDER BY created_at, rowid');
    return rows.map((r) => JSON.parse(r.payload) as SyncAction);
  }

  private async applyLocally(type: ActionType, assignmentId: string, at?: Date): Promise<CompletionResult | null> {
    const { chores } = this.services;
    if (type === 'complete') return chores.complete(assignmentId, at);
    if (type === 'skip') await chores.buyout(assignmentId, at);
    else await chores.undo(assignmentId);
    return null;
  }
}
