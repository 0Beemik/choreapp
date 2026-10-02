import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { CompletionResult } from '../services/ChoreService';
import {
  deviceName,
  findHubAddress,
  httpTransport,
  lanSyncSupported,
  startHubServer,
  startKeepAlive,
  stopKeepAlive,
} from '../sync/device';
import type { ActionType } from '../sync/protocol';
import { SyncHub } from '../sync/SyncHub';
import { SyncMember, type MemberLink, type SyncStatus } from '../sync/SyncMember';
import { useApp } from './AppContext';

const MEMBER_SYNC_EVERY_MS = 30 * 1000;

/** hub = this device owns the family data; member = joined another device's family. */
export type DeviceMode = 'none' | 'hub' | 'member';

export interface MemberSyncState {
  status: SyncStatus | 'idle';
  lastSyncAt: string | null;
  pending: number;
  /** Things the main device refused, e.g. "That chore belongs to someone else." */
  refused: string[];
}

interface SyncContextValue {
  supported: boolean;
  mode: DeviceMode;
  link: MemberLink | null;
  memberState: MemberSyncState;
  hub: SyncHub;
  hubPort: number | null;
  /** Tick off, undo or skip a chore, wherever the family data lives. */
  act: (type: ActionType, assignmentId: string) => Promise<CompletionResult | null>;
  syncNow: () => Promise<void>;
  join: (address: string, code: string) => Promise<MemberLink>;
  chooseUser: (userId: string | null) => Promise<void>;
  leave: () => Promise<void>;
  /** Call after pairing/removing devices so the hub's keep-alive matches. */
  devicesChanged: () => Promise<void>;
}

const Ctx = createContext<SyncContextValue | null>(null);

export function useSync(): SyncContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSync must be used inside <SyncProvider>');
  return v;
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { services, family, refresh } = useApp();
  const [member] = useState(() => new SyncMember(services, httpTransport, findHubAddress));
  const [hub] = useState(() => new SyncHub(services));
  const [link, setLink] = useState<MemberLink | null>(null);
  const [linkLoaded, setLinkLoaded] = useState(false);
  const [hubPort, setHubPort] = useState<number | null>(null);
  const [memberState, setMemberState] = useState<MemberSyncState>({
    status: 'idle',
    lastSyncAt: null,
    pending: 0,
    refused: [],
  });

  const reloadLink = useCallback(
    () =>
      member.link().then((l) => {
        setLink(l);
        setLinkLoaded(true);
      }),
    [member],
  );

  useEffect(() => {
    reloadLink();
  }, [reloadLink]);

  const mode: DeviceMode = !linkLoaded || !family ? 'none' : link ? 'member' : 'hub';

  // ── Joined device: send taps and pull the family's latest data ─────────────────────
  const syncNow = useCallback(async () => {
    if (mode !== 'member') return;
    const outcome = await member.sync().catch(() => ({ status: 'offline' as const, rejected: [] }));
    const [fresh, pending] = await Promise.all([member.link(), member.pendingCount()]);
    setLink(fresh);
    setMemberState({
      status: outcome.status,
      lastSyncAt: fresh?.lastSyncAt ?? null,
      pending,
      refused: outcome.rejected.map((r) => r.message),
    });
    await refresh();
  }, [mode, member, refresh]);

  useEffect(() => {
    if (mode !== 'member') return;
    const first = setTimeout(syncNow, 0);
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') syncNow();
    }, MEMBER_SYNC_EVERY_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') syncNow();
    });
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      sub.remove();
    };
  }, [mode, syncNow]);

  // ── Main device: answer the family's other devices ─────────────────────────────────
  const devicesChanged = useCallback(async () => {
    const n = (await hub.devices()).length;
    if (n > 0) await startKeepAlive(`Sharing chores with ${n} family device${n === 1 ? '' : 's'}`);
    else await stopKeepAlive();
  }, [hub]);

  const familyId = family?.id;
  useEffect(() => {
    if (mode !== 'hub' || !familyId || !lanSyncSupported) return;
    const unsubscribe = hub.addChangeListener(() => {
      refresh().catch(() => undefined);
    });
    let stop: (() => Promise<void>) | null = null;
    let cancelled = false;
    startHubServer(hub, familyId)
      .then(async (server) => {
        if (cancelled) return server.stop();
        stop = server.stop;
        setHubPort(server.port);
        await devicesChanged();
      })
      .catch((e) => console.warn('Hub server failed to start', e));
    return () => {
      cancelled = true;
      unsubscribe();
      stop?.();
    };
  }, [mode, familyId, hub, refresh, devicesChanged]);

  const act = useCallback(
    async (type: ActionType, assignmentId: string) => {
      let result: CompletionResult | null = null;
      try {
        if (mode === 'member') {
          result = await member.act(type, assignmentId);
        } else if (type === 'complete') {
          result = await services.chores.complete(assignmentId);
        } else if (type === 'skip') {
          await services.chores.buyout(assignmentId);
        } else {
          await services.chores.undo(assignmentId);
        }
      } finally {
        await refresh();
      }
      if (mode === 'member') syncNow().catch(() => undefined);
      return result;
    },
    [mode, member, services, refresh, syncNow],
  );

  const join = useCallback(
    async (address: string, code: string) => {
      const l = await member.join(address, code, deviceName());
      await refresh();
      await reloadLink();
      return l;
    },
    [member, refresh, reloadLink],
  );

  const chooseUser = useCallback(
    async (userId: string | null) => {
      await member.setUser(userId);
      await reloadLink();
      await member.sync().catch(() => undefined);
      await refresh();
    },
    [member, reloadLink, refresh],
  );

  const leave = useCallback(async () => {
    await member.leave();
    await reloadLink();
    await refresh();
  }, [member, reloadLink, refresh]);

  const value = useMemo<SyncContextValue>(
    () => ({
      supported: lanSyncSupported,
      mode,
      link,
      memberState,
      hub,
      hubPort,
      act,
      syncNow,
      join,
      chooseUser,
      leave,
      devicesChanged,
    }),
    [mode, link, memberState, hub, hubPort, act, syncNow, join, chooseUser, leave, devicesChanged],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
