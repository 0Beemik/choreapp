import type { DayKey, Weekday } from '../lib/dates';

export type Role = 'parent' | 'child';

export interface FamilySettings {
  pointsPerChore: number;
  /** Unused since skips became free (1.2); kept so older data still loads. */
  buyoutCostPercentage: number;
  maxBuyoutsPerMonth: number;
  rotationDay: Weekday;
  /** Points deducted when a chore's period ends and it was never done. */
  missedChorePenalty: number;
  /** Lowest price (coins) a chore can be put up for sale at. */
  minSellPrice: number;
  /** Sales each person may post per chore week (handoffs to buy offers don't count). */
  maxSalesPerWeek: number;
  /** Coins a push costs; sending a pushed chore back costs half, rounded up. */
  pushCost: number;
  /** Pushes each person may send, and may receive, per chore week. */
  maxPushesPerWeek: number;
}

export interface Family {
  id: string;
  name: string;
  settings: FamilySettings;
  /** Start of the most recent chore week that has been assigned. */
  currentPeriodStart: DayKey | null;
  createdAt: string;
}

export interface User {
  id: string;
  familyId: string;
  name: string;
  age: number;
  role: Role;
  avatarEmoji: string;
  avatarColor: string;
  /** Full weekly allowance in dollars if every chore is done. */
  allowanceRate: number;
  createdAt: string;
}

export type ChoreFrequency = 'daily' | 'weekly';

/** Part of the day a chore belongs to. 'any' = all day. */
export type TimeOfDay = 'any' | 'morning' | 'afternoon' | 'evening';

/** Order chores appear in on the board; all-day ones last. */
export const TIMES_OF_DAY: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'any'];

export interface Chore {
  id: string;
  familyId: string;
  name: string;
  icon: string;
  frequency: ChoreFrequency;
  /** null = use the family's pointsPerChore. */
  points: number | null;
  /** Family members (kids or parents) who each do their own copy. Empty = rotates weekly between kids. */
  assigneeIds: string[];
  timeOfDay: TimeOfDay;
  /** Coins paid to whoever does it: 2, or 3 when a parent adds a bonus coin. */
  coins: number;
  /** Spreads rotating chores across kids within the same week. */
  rotationOffset: number;
  isActive: boolean;
  createdAt: string;
}

export type AssignmentStatus = 'pending' | 'completed' | 'bought_out' | 'missed' | 'excused';

export interface ChoreAssignment {
  id: string;
  familyId: string;
  choreId: string;
  userId: string;
  periodStart: DayKey;
  /** The day it must be done by (the day itself for daily chores, week end for weekly). */
  dueDate: DayKey;
  status: AssignmentStatus;
  completedAt: string | null;
  pointsAwarded: number;
  pointsSpent: number;
  createdAt: string;
}

export type TransactionType = 'earned' | 'spent' | 'penalty' | 'bonus' | 'adjustment';

export interface PointTransaction {
  id: string;
  familyId: string;
  userId: string;
  assignmentId: string | null;
  type: TransactionType;
  amount: number;
  reason: string;
  createdAt: string;
}

export type CoinTransactionType =
  | 'earned'
  | 'bonus'
  | 'adjustment'
  /** Coins set aside when selling or sending a chore; paid out when it's done, else refunded. */
  | 'market_hold'
  | 'market_payout'
  | 'market_refund'
  /** Paid to push a chore, or to send a pushed one back. Nobody collects these. */
  | 'push_cost'
  | 'push_reject';

export interface CoinTransaction {
  id: string;
  familyId: string;
  userId: string;
  assignmentId: string | null;
  /** What else caused it, e.g. a market listing. */
  refId: string | null;
  type: CoinTransactionType;
  amount: number;
  reason: string;
  createdAt: string;
}

/**
 * sale    – owner pays the price up front; a buyer takes the chore and gets the price when it's done.
 * offer   – a standing "I'll do a chore for N coins" on the market.
 * handoff – a chore sent to someone's offer; they accept or decline.
 * push    – a chore forced on someone; they do it or pay half the push cost to send it back.
 */
export type ListingKind = 'sale' | 'offer' | 'handoff' | 'push';

/**
 * open      – waiting (for a buyer, an answer, or the deadline)
 * accepted  – chore changed hands; for sales/handoffs the price is held until it's done
 * paid      – done, price paid to the doer
 * refunded  – not done, price returned to the seller
 * expired / cancelled / declined / rejected – closed without changing hands
 */
export type ListingStatus = 'open' | 'accepted' | 'paid' | 'refunded' | 'expired' | 'cancelled' | 'declined' | 'rejected';

export interface MarketListing {
  id: string;
  familyId: string;
  kind: ListingKind;
  status: ListingStatus;
  /** null for offers. */
  assignmentId: string | null;
  /** Seller, offer poster, handoff sender or pusher. */
  fromUserId: string;
  /** Buyer, handoff receiver or push target. */
  toUserId: string | null;
  /** The offer a handoff was sent to. */
  offerId: string | null;
  price: number;
  /** Local timestamp after which an open listing closes. */
  deadline: string | null;
  periodStart: DayKey;
  createdAt: string;
  resolvedAt: string | null;
}

export type NotificationKind =
  | 'sale_posted'
  | 'sale_bought'
  | 'sale_unsold'
  | 'offer_posted'
  | 'handoff_request'
  | 'handoff_accepted'
  | 'handoff_closed'
  | 'push_received'
  | 'push_rejected'
  | 'payout'
  | 'refund'
  /** For parents: a chore was ticked off. refId is `<doer id>|<assignment id>`. */
  | 'chore_done';

export interface AppNotification {
  id: string;
  familyId: string;
  /** Who it's for. */
  userId: string;
  kind: NotificationKind;
  text: string;
  refId: string | null;
  createdAt: string;
}

export type BadgeCriteria =
  | 'completions'
  | 'lifetime_points'
  | 'streak_days'
  | 'perfect_week'
  | 'weekly_winner';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
  threshold: number;
  bonusPoints: number;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: string;
}

export interface Vacation {
  id: string;
  familyId: string;
  startDate: DayKey;
  endDate: DayKey;
}

export interface LeaderboardRow {
  user: User;
  points: number;
  completed: number;
  rank: number;
}
