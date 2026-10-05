import { uuid } from '../lib/crypto';
import { SerialQueue } from '../lib/SerialQueue';
import type { Services } from '../services';
import type { CompletionResult } from '../services/ChoreService';
import { UserFacingError } from '../services/deps';
import { parseLocal } from './SyncHub';
import { importSnapshot } from './snapshot';
import {
  PROTOCOL_VERSION,
  type ActionType,
  type HelloResponse,
  type HubTransport,
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
    if (!res) {
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
