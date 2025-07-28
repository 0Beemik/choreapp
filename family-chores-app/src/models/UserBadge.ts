export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
  periodStart?: Date;
  periodEnd?: Date;
}
