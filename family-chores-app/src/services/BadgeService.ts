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
        // return this.checkCompletionStreak(userId, badge.criteria);
        return false;
      case 'points_milestone':
        return this.checkPointsMilestone(userId, badge.criteria);
      case 'perfect_week':
        // return this.checkPerfectWeek(userId);
        return false;
      default:
        return false;
    }
  }

  private async checkPointsMilestone(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    const totalPoints = await this.pointsRepo.getUserTotal(userId);
    return totalPoints >= criteria.threshold;
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