export interface AchievementProgress {
  id: string;
  userId: string;
  badgeId: string;
  currentProgress: number;
  requiredProgress: number;
  progressPercentage: number;
  estimatedCompletion?: Date;
  lastUpdated: Date;
}
