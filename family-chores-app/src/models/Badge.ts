import { BadgeCategory, Rarity } from '../types';

export interface BadgeCriteria {
  type: 'completion_streak' | 'perfect_week' | 'points_milestone' | 'leaderboard_position';
  threshold: number;
  period?: 'daily' | 'weekly' | 'monthly';
  consecutiveRequired?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  category: BadgeCategory;
  criteria: BadgeCriteria;
  bonusPoints: number;
  rarity: Rarity;
  isActive: boolean;
  createdAt: Date;
}