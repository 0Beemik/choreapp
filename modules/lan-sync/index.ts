import { requireOptionalNativeModule } from 'expo';

export interface EventSubscription {
  remove(): void;
}

export interface DiscoveredHub {
  name: string;
  host: string;
  port: number;
}

export interface IncomingRequest {
  id: string;
  path: string;
  body: string;
}

interface LanSyncNative {
  startServer(preferredPort: number): Promise<number>;
  stopServer(): Promise<void>;
  respond(id: string, status: number, body: string): void;
  advertise(name: string, port: number): Promise<string>;
  stopAdvertising(): Promise<void>;
  discover(timeoutMs: number): Promise<DiscoveredHub[]>;
  localAddresses(): Promise<string[]>;
  startKeepAlive(title: string, text: string): Promise<void>;
  stopKeepAlive(): Promise<void>;
  addListener(event: 'onRequest', listener: (req: IncomingRequest) => void): EventSubscription;
}

/** Null where the native side doesn't exist yet (iOS, web, Expo Go). */
export const LanSync = requireOptionalNativeModule<LanSyncNative>('LanSync');
