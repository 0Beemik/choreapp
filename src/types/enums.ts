export enum Rarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum BadgeCategory {
  COMPLETION = 'completion',
  CONSISTENCY = 'consistency',
  EXCELLENCE = 'excellence',
  COMMUNITY = 'community',
}

export enum AdminPermission {
  MANAGE_USERS = 'manage_users',
  MANAGE_CHORES = 'manage_chores',
  MANAGE_POINTS = 'manage_points',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_REPORTS = 'view_reports',
}

export enum LeaderboardPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
  YEARLY = 'yearly',
}

export enum AssignmentType {
  PERMANENT = 'permanent',
  WEEKLY = 'weekly',
  DAILY = 'daily',
  MONTHLY = 'monthly',
}

export enum AssignmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  BOUGHT_OUT = 'bought_out',
}

export enum UserRole {
  PARENT = 'parent',
  CHILD = 'child',
}

export enum TransactionType {
  EARNED = 'earned',
  DEDUCTED = 'deducted',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

export enum TransactionCategory {
  CHORE = 'chore',
  BUYOUT = 'buyout',
  BONUS = 'bonus',
  PENALTY = 'penalty',
  CORRECTION = 'correction',
  EMERGENCY = 'emergency',
  GIFT = 'gift',
}

export enum ChoreCategory {
  CLEANING = 'cleaning',
  ORGANIZING = 'organizing',
  PET_CARE = 'pet_care',
  YARD_WORK = 'yard_work',
  OTHER = 'other',
}
