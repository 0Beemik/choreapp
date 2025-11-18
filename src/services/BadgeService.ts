import { Badge, BadgeCriteria } from '../models/Badge';
import { UserBadge } from '../models/UserBadge';
import { IBadgeRepository } from '../repositories/BadgeRepository';
import { IUserBadgeRepository } from '../repositories/UserBadgeRepository';
import { IAssignmentRepository } from '../repositories/AssignmentRepository';
import { IPointsRepository } from '../repositories/PointsRepository';

export interface IBadgeService {
  evaluateUserBadges(userId: string): Promise<UserBadge[]>;
  checkEligibility(userId: string, badge: Badge): Promise<boolean>;
  awardBadge(userId: string, badgeId: string): Promise<UserBadge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
}

export class BadgeService implements IBadgeService {
  constructor(
    private badgeRepo: IBadgeRepository,
    private userBadgeRepo: IUserBadgeRepository,
    private assignmentRepo: IAssignmentRepository,
    private pointsRepo: IPointsRepository
  ) {}

  async evaluateUserBadges(userId: string): Promise<UserBadge[]> {
    const allBadges = await this.badgeRepo.findAll();
    const activeBadges = allBadges.filter(badge => badge.isActive);
    const userBadges = await this.userBadgeRepo.findByUserId(userId);
    const awardedBadges: UserBadge[] = [];

    for (const badge of activeBadges) {
      const alreadyHasBadge = userBadges.some(ub => ub.badgeId === badge.id);
      if (alreadyHasBadge) {
        continue;
      }

      const isEligible = await this.checkEligibility(userId, badge);
      if (isEligible) {
        const newBadge = await this.awardBadge(userId, badge.id);
        awardedBadges.push(newBadge);
      }
    }

    return awardedBadges;
  }

  async checkEligibility(userId: string, badge: Badge): Promise<boolean> {
    switch (badge.criteria.type) {
      case 'completion_streak':
        return this.checkCompletionStreak(userId, badge.criteria);
      case 'points_milestone':
        return this.checkPointsMilestone(userId, badge.criteria);
      case 'perfect_week':
        return this.checkPerfectWeek(userId, badge.criteria);
      case 'leaderboard_position':
        return this.checkLeaderboardPosition(userId, badge.criteria);
      default:
        return false;
    }
  }

  private async checkPointsMilestone(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    const totalPoints = await this.pointsRepo.getUserTotal(userId);
    return totalPoints >= criteria.threshold;
  }

  private async checkCompletionStreak(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    // Get completed assignments from the last 60 days (enough to check any reasonable streak)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);

    const assignments = await this.assignmentRepo.findByUserIdAndPeriod(userId, startDate, endDate);
    const completed = assignments.filter(a => a.status === 'completed' && a.completedAt);

    if (completed.length === 0) {
      return false;
    }

    // Build a set of dates when chores were completed
    const completionDates = new Set<string>();
    completed.forEach(assignment => {
      if (assignment.completedAt) {
        const dateStr = assignment.completedAt.toISOString().split('T')[0]; // YYYY-MM-DD
        completionDates.add(dateStr);
      }
    });

    // Check for consecutive days streak starting from today
    let currentStreak = 0;
    const today = new Date();

    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (completionDates.has(dateStr)) {
        currentStreak++;
      } else {
        // Streak broken
        break;
      }
    }

    return currentStreak >= criteria.threshold;
  }

  private async checkPerfectWeek(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    // Check if user completed ALL assigned chores in the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const assignments = await this.assignmentRepo.findByUserIdAndPeriod(userId, startDate, endDate);

    if (assignments.length === 0) {
      return false; // No chores assigned
    }

    // Check if ALL assignments are completed (none pending, none bought out)
    const allCompleted = assignments.every(a => a.status === 'completed');

    return allCompleted;
  }

  private async checkLeaderboardPosition(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    // Check if user's current ranking is within the threshold (e.g., top 3)
    try {
      // Get user's total points
      const userPoints = await this.pointsRepo.getUserTotal(userId);

      if (userPoints === 0) {
        return false; // Can't be in top positions with no points
      }

      // For a complete implementation, we would query all family members' points
      // and calculate the actual ranking. For now, we'll use a simplified approach:
      // User qualifies if they have points and threshold is reasonable (1-10)
      // This should be enhanced with actual family-wide ranking calculation

      // Placeholder: Accept if user has points and is going for a reasonable position
      return criteria.threshold <= 10 && userPoints > 0;
    } catch (error) {
      console.error('Error checking leaderboard position:', error);
      return false;
    }
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const badge = await this.badgeRepo.findById(badgeId);
    if (!badge) {
      throw new Error(`Badge with id ${badgeId} not found.`);
    }

    const userBadge = await this.userBadgeRepo.create({
      userId,
      badgeId,
      earnedAt: new Date(),
    });

    return userBadge;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadgeRepo.findByUserId(userId);
  }
}