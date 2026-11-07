import type { MarketOp } from '../services/MarketService';

// Wire format between a joined device and the hub. Bump PROTOCOL_VERSION on breaking changes.
export const PROTOCOL_VERSION = 5;
export const SERVICE_TYPE = 'familychores';
export const DEFAULT_PORT = 47821;

export type ActionType = 'complete' | 'undo' | 'skip';

export interface SyncAction {
  id: string;
  type: ActionType;
  assignmentId: string;
  /** Local timestamp of when the kid tapped it on their device. */
  at: string;
}

export interface ActionResult {
  id: string;
  ok: boolean;
  message: string | null;
}

export type Row = Record<string, string | number | null>;

export interface Snapshot {
  version: number;
  tables: Record<string, Row[]>;
}

export interface HelloResponse {
  protocol: number;
  hubId: string;
  familyName: string;
}

export interface PairRequest {
  code: string;
  deviceName: string;
}

export interface PairResponse {
  hubId: string;
  deviceId: string;
  token: string;
  snapshot: Snapshot;
}

export interface SyncRequest {
  token: string;
  knownVersion: number;
  actions: SyncAction[];
  /** Which family member uses this device (null = whole-family view). */
  userId?: string | null;
}

export interface SyncResponse {
  results: ActionResult[];
  /** Omitted when the device already has the latest data. */
  snapshot: Snapshot | null;
}

/**
 * Market moves can't be applied offline and merged later (two kids could buy the same chore),
 * so they go straight to the hub, which answers yes or no with fresh data.
 */
export interface MarketRequest {
  token: string;
  /** Who is acting. A device tied to one person can only act as them. */
  actorId: string;
  op: MarketOp;
}

export interface MarketResponse {
  ok: boolean;
  message: string | null;
  snapshot: Snapshot;
}

/** Moving the main device: the new device asks with the parent PIN, saves everything, then commits. */
export interface HandoverPrepareRequest {
  token: string;
  pin: string;
}

export interface HandoverPrepareResponse {
  hubId: string;
  familyName: string;
  full: Snapshot;
}

export interface HandoverCommitRequest {
  token: string;
}

export interface HttpResult {
  status: number;
  body: unknown;
}

/** How a joined device reaches its hub. Real devices use HTTP; tests call the hub directly. */
export interface HubTransport {
  post(address: string, path: string, body: unknown): Promise<HttpResult>;
}
