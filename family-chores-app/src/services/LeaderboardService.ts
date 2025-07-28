import { LeaderboardEntry } from '../models/LeaderboardEntry';
import { PointTransaction } from '../models/PointTransaction';
import { ILeaderboardRepository, LeaderboardRepository } from '../repositories/LeaderboardRepository';
import { IPointsRepository, PointsRepository } from '../repositories/PointsRepository';
import { IUserRepository, UserRepository } from '../repositories/UserRepository';
import { AssignmentRepository, IAssignmentRepository } from '../repositories/AssignmentRepository';
import { BadgeRepository, IBadgeRepository } from '../repositories/BadgeRepository';
import { IUserBadgeRepository, UserBadgeRepository } from '../repositories/UserBadgeRepository';
import { LeaderboardPeriod } from '../types';
import { Badge } from '../models/Badge';

type HistoricalRanking = {
  period: string;
  rank: number;
  points: number;
};

export interface ILeaderboardService {
  generateLeaderboard(familyId: string, period: LeaderboardPeriod, periodStart: Date, periodEnd: Date): Promise<LeaderboardEntry[]>;
  awardChoreCompletionBonuses(familyId: string, period: LeaderboardPeriod, periodStart: Date, periodEnd: Date): Promise<PointTransaction[]>;
  getHistoricalRankings(userId: string): Promise<HistoricalRanking[]>;
}

export class LeaderboardService implements ILeaderboardService {
  private static readonly CHORE_COMPLETION_BONUS = 50;

  constructor(
    private leaderboardRepository: ILeaderboardRepository = new LeaderboardRepository(),
    private pointsRepository: IPointsRepository = new PointsRepository(),
    private userRepository: IUserRepository = new UserRepository(),
    private assignmentRepository: IAssignmentRepository = new AssignmentRepository(),
    private userBadgeRepository: IUserBadgeRepository = new UserBadgeRepository(),
    private badgeRepository: IBadgeRepository = new BadgeRepository()
  ) {}

  async generateLeaderboard(familyId: string, period: LeaderboardPeriod, periodStart: Date, periodEnd: Date): Promise<LeaderboardEntry[]> {
    const users = await this.userRepository.findByFamilyId(familyId);
    const leaderboardEntries: Omit<LeaderboardEntry, 'id' | 'createdAt' | 'position'>[] = [];

    for (const user of users) {
      const pointsHistory = await this.pointsRepository.findByUserId(user.id, periodStart, periodEnd);
      const totalPoints = pointsHistory.reduce((sum, t) => sum + (t.transactionType === 'earned' ? t.amount : -t.amount), 0);
      const assignments = await this.assignmentRepository.findByUserIdAndPeriod(user.id, periodStart, periodEnd);
      const choreCount = assignments.filter(a => a.status === 'completed').length;
      const userBadges = await this.userBadgeRepository.findByUserIdAndPeriod(user.id, periodStart, periodEnd);
      const badgesEarned = await Promise.all(userBadges.map(ub => this.badgeRepository.findById(ub.badgeId)));
      
      leaderboardEntries.push({
        familyId,
        userId: user.id,
        periodType: period,
        periodStart,
        periodEnd,
        totalPoints,
        choreCount,
        badgesEarned: badgesEarned.filter(b => b !== null) as Badge[],
        bonusPoints: 0,
      });
    }

    // Sort by points descending
    leaderboardEntries.sort((a, b) => b.totalPoints - a.totalPoints);

    const finalEntries: LeaderboardEntry[] = [];
    for (let i = 0; i < leaderboardEntries.length; i++) {
      const entryData = { ...leaderboardEntries[i], position: i + 1 };
      const newEntry = await this.leaderboardRepository.create(entryData);
      finalEntries.push(newEntry);
    }

    return finalEntries;
  }

  async awardChoreCompletionBonuses(familyId: string, period: LeaderboardPeriod, periodStart: Date, periodEnd: Date): Promise<PointTransaction[]> {
    if (period !== 'weekly') {
      return []; // Bonuses are only for weekly chores
    }

    const users = await this.userRepository.findByFamilyId(familyId);
    const bonusTransactions: PointTransaction[] = [];

    for (const user of users) {
      const assignments = await this.assignmentRepository.findByUserIdAndPeriod(user.id, periodStart, periodEnd);
      
      if (assignments.length === 0) {
        continue;
      }

      const allChoresCompleted = assignments.every(a => a.status === 'completed');

      if (allChoresCompleted) {
        const transaction = await this.pointsRepository.create({
          userId: user.id,
          choreId: null,
          amount: LeaderboardService.CHORE_COMPLETION_BONUS,
          transactionType: 'earned',
          description: `Weekly chore completion bonus`,
        });
        bonusTransactions.push(transaction);
      }
    }

    return bonusTransactions;
  }

  async getHistoricalRankings(userId: string): Promise<HistoricalRanking[]> {
    const entries = await this.leaderboardRepository.getHistoricalRankings(userId);
    return entries.map(e => ({
      period: `${e.periodType} - ${e.periodStart.toLocaleDateString()}`,
      rank: e.position,
      points: e.totalPoints,
    }));
  }
}

export const leaderboardService = new LeaderboardService();
