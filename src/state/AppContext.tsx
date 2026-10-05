import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { ExpoDb } from '../database/connection';
import { SerialQueue } from '../lib/SerialQueue';
import type { Chore, Family, User } from '../models';
import { createServices, type Board, type Services } from '../services';

const PARENT_SESSION_MS = 15 * 60 * 1000;

interface AppData {
  family: Family | null;
  members: User[];
  kids: User[];
  chores: Chore[];
  board: Board | null;
  balances: Record<string, number>;
}

interface AppContextValue extends AppData {
  services: Services;
  /** Reload everything from the database; call after any change. */
  refresh: () => Promise<void>;
  parentUnlocked: boolean;
  unlockParent: (pin: string) => Promise<boolean>;
  lockParent: () => void;
}

const EMPTY: AppData = { family: null, members: [], kids: [], chores: [], board: null, balances: {} };

const Ctx = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}

async function loadData(s: Services): Promise<AppData> {
  const family = await s.family.current();
  if (!family) return EMPTY;
  // Closes out yesterday / last week and deals new chores whenever the date has moved on.
  await s.rotation.ensureCurrentPeriod(family.id);
  const [fresh, members, chores, board, balances] = await Promise.all([
    s.family.current(),
    s.family.members(family.id),
    s.chores.list(family.id),
    s.board.load(family.id),
    s.points.balances(family.id),
  ]);
  return { family: fresh, members, kids: members.filter((m) => m.role === 'child'), chores, board, balances };
}

export function AppProvider({
  children,
  onReady,
  onError,
}: {
  children: ReactNode;
  onReady?: () => void;
  onError?: (e: Error) => void;
}) {
  const [services, setServices] = useState<Services | null>(null);
  const [data, setData] = useState<AppData>(EMPTY);
  const [parentUnlocked, setParentUnlocked] = useState(false);
  // Serialize reloads so a refresh requested mid-load is never dropped or overtaken.
  const [queue] = useState(() => new SerialQueue());
  const load = useCallback((s: Services) => queue.run(() => loadData(s).then(setData)), [queue]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await createServices(await ExpoDb.open());
        if (cancelled) return;
        await load(s);
        setServices(s);
        onReady?.();
      } catch (e) {
        onError?.(e as Error);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Opening the database happens exactly once per app launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new day can start while the app sits open on the kitchen counter.
  useEffect(() => {
    if (!services) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load(services).catch(() => undefined);
    });
    const timer = setInterval(() => load(services).catch(() => undefined), 5 * 60 * 1000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [services, load]);

  // The parent session ends on its own after 15 minutes.
  useEffect(() => {
    if (!parentUnlocked) return;
    const t = setTimeout(() => setParentUnlocked(false), PARENT_SESSION_MS);
    return () => clearTimeout(t);
  }, [parentUnlocked]);

  const familyId = data.family?.id;
  const unlockParent = useCallback(
    async (pin: string) => {
      if (!services || !familyId) return false;
      const ok = await services.family.verifyPin(familyId, pin);
      if (ok) setParentUnlocked(true);
      return ok;
    },
    [services, familyId],
  );
  const lockParent = useCallback(() => setParentUnlocked(false), []);
  const refresh = useCallback(() => (services ? load(services) : Promise.resolve()), [services, load]);

  const value = useMemo<AppContextValue | null>(
    () => (services ? { ...data, services, refresh, parentUnlocked, unlockParent, lockParent } : null),
    [services, data, refresh, parentUnlocked, unlockParent, lockParent],
  );

  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
