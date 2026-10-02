import { Platform } from 'react-native';
import { LanSync, type EventSubscription } from '../../modules/lan-sync';
import { DEFAULT_PORT, PROTOCOL_VERSION, type HelloResponse, type HubTransport } from './protocol';
import type { SyncHub } from './SyncHub';

const REQUEST_TIMEOUT_MS = 8000;

/** True where home-network sync is available (Android today; iOS later). */
export const lanSyncSupported = LanSync !== null;

export const httpTransport: HubTransport = {
  async post(address, path, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`http://${address}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    } finally {
      clearTimeout(timer);
    }
  },
};

export function deviceName(): string {
  const c = Platform.constants as { Model?: string; Brand?: string };
  return [c.Brand, c.Model].filter(Boolean).join(' ') || 'Family device';
}

const serviceName = (hubId: string) => `fc-${hubId}`;

/** Starts answering family devices on the home network. Returns a stop function. */
export async function startHubServer(hub: SyncHub, hubId: string): Promise<{ port: number; stop: () => Promise<void> }> {
  if (!LanSync) throw new Error('Home-network sync is not available on this device.');
  const sync = LanSync;
  const sub: EventSubscription = sync.addListener('onRequest', async (req) => {
    let body: unknown = null;
    try {
      body = req.body ? JSON.parse(req.body) : {};
    } catch {
      sync.respond(req.id, 400, JSON.stringify({ error: 'bad json' }));
      return;
    }
    const res = await hub.handle(req.path, body);
    sync.respond(req.id, res.status, JSON.stringify(res.body));
  });
  const port = await sync.startServer(DEFAULT_PORT);
  await sync.advertise(serviceName(hubId), port).catch((e) => console.warn('Could not announce hub', e));
  return {
    port,
    stop: async () => {
      sub.remove();
      await sync.stopAdvertising().catch(() => undefined);
      await sync.stopServer().catch(() => undefined);
    },
  };
}

export async function hubAddresses(port: number): Promise<string[]> {
  const ips = (await LanSync?.localAddresses()) ?? [];
  return ips.map((ip) => `${ip}:${port}`);
}

export interface FoundHub {
  address: string;
  hubId: string;
  familyName: string;
}

/** Looks for family main devices on this Wi-Fi network. */
export async function discoverHubs(timeoutMs = 4000): Promise<FoundHub[]> {
  if (!LanSync) return [];
  const services = await LanSync.discover(timeoutMs).catch(() => []);
  const hubs = await Promise.all(
    services
      .filter((s) => s.name.startsWith('fc-'))
      .map(async (s) => {
        const address = `${s.host}:${s.port}`;
        const res = await httpTransport.post(address, '/hello', {}).catch(() => null);
        const hello = res?.body as HelloResponse | null;
        if (!hello?.hubId || hello.protocol !== PROTOCOL_VERSION) return null;
        return { address, hubId: hello.hubId, familyName: hello.familyName };
      }),
  );
  return hubs.filter((h): h is FoundHub => h !== null);
}

/** Finds a specific hub again (e.g. after the router handed it a new address). */
export async function findHubAddress(hubId: string): Promise<string | null> {
  if (!LanSync) return null;
  const services = await LanSync.discover(3000).catch(() => []);
  const s = services.find((x) => x.name === serviceName(hubId));
  return s ? `${s.host}:${s.port}` : null;
}

/** Accepts "192.168.1.20" or "192.168.1.20:47821". */
export function normalizeAddress(input: string): string | null {
  const m = /^\s*(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{2,5}))?\s*$/.exec(input);
  if (!m) return null;
  return `${m[1]}:${m[2] ?? DEFAULT_PORT}`;
}

export async function startKeepAlive(text: string): Promise<void> {
  await LanSync?.startKeepAlive('Family Chores', text).catch(() => undefined);
}

export async function stopKeepAlive(): Promise<void> {
  await LanSync?.stopKeepAlive().catch(() => undefined);
}
