import type { DayKey, Weekday } from '../lib/dates';

export type Role = 'parent' | 'child';

export interface FamilySettings {
  pointsPerChore: number;
  /** Buyout price as a percentage of the chore's points. */
  buyoutCostPercentage: number;
  maxBuyoutsPerMonth: number;
  rotationDay: Weekday;
  /** Points deducted when a chore's period ends and it was never done. */
  missedChorePenalty: number;
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

export interface Chore {
  id: string;
  familyId: string;
  name: string;
  icon: string;
  frequency: ChoreFrequency;
  /** null = use the family's pointsPerChore. */
  points: number | null;
  /** null = rotates weekly between kids. */
  fixedUserId: string | null;
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
