import { LeaderboardPeriod } from '../types/enums';

export interface LeaderboardEntry {
  id: string;
  familyId: string;
  userId: string;
  periodType: LeaderboardPeriod;
  periodStart: Date;
  periodEnd: Date;
  totalPoints: number;
  choreCount: number;
  position: number;
  badgesEarned: string[]; // JSON array of badge names
  bonusPoints: number;
  createdAt: Date;
}
