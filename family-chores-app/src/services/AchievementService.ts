import { AchievementProgress } from '../models/Achievement';
import { Badge } from '../models/Badge';
import { IAchievementRepository } from '../repositories/AchievementRepository';
import { IBadgeRepository } from '../repositories/BadgeRepository';
import { IAssignmentRepository } from '../repositories/AssignmentRepository';
import { IPointsRepository } from '../repositories/PointsRepository';
import { IBadgeService } from './BadgeService';
import { ChoreAssignment } from '../models/ChoreAssignment';

export interface IAchievementService {
  updateProgressForAllBadges(userId: string): Promise<void>;
  updateProgress(userId: string, badge: Badge): Promise<AchievementProgress | null>;
  getAchievementProgressForUser(userId: string): Promise<AchievementProgress[]>;
}

export class AchievementService implements IAchievementService {
  constructor(
    private achievementRepo: IAchievementRepository,
    private badgeRepo: IBadgeRepository,
    private assignmentRepo: IAssignmentRepository,
    private pointsRepo: IPointsRepository,
    private badgeService: IBadgeService
  ) {}

  async updateProgressForAllBadges(userId: string): Promise<void> {
    const allBadges = await this.badgeRepo.findAll();
    for (const badge of allBadges) {
      if (badge.isActive) {
        await this.updateProgress(userId, badge);
      }
    }
  }

  async updateProgress(userId: string, badge: Badge): Promise<AchievementProgress | null> {
    let progress = await this.achievementRepo.findByUserIdAndBadgeId(userId, badge.id);

    if (!progress) {
      progress = await this.achievementRepo.create({
        userId,
        badgeId: badge.id,
        currentProgress: 0,
        requiredProgress: badge.criteria.threshold,
        progressPercentage: 0,
        lastUpdated: new Date(),
      });
    }

    let newProgressValue = progress.currentProgress;

    switch (badge.criteria.type) {
      case 'completion_streak': {
        // const history = await this.assignmentRepo.getCompletionHistory(userId, badge.criteria.threshold * 2);
        // newProgressValue = this.calculateStreak(history);
        break;
      }
      case 'points_milestone':
        newProgressValue = await this.pointsRepo.getUserTotal(userId);
        break;
      case 'perfect_week': {
        const isPerfect = await this.badgeService.checkEligibility(userId, badge);
        if (isPerfect) {
          newProgressValue = badge.criteria.threshold;
        }
        break;
      }
    }

    const updatedProgress = await this.achievementRepo.update(progress.id, {
      currentProgress: newProgressValue,
      progressPercentage: (newProgressValue / progress.requiredProgress) * 100,
      lastUpdated: new Date(),
    });

    if (updatedProgress.progressPercentage >= 100) {
      await this.badgeService.awardBadge(userId, badge.id);
    }

    return updatedProgress;
  }

  private calculateStreak(history: ChoreAssignment[]): number {
    let streak = 0;
    let lastDate = new Date();

    for (let i = 0; i < history.length; i++) {
      const completionDate = history[i].completedAt;
      if (!completionDate) continue;

      if (i === 0) {
        streak = 1;
        lastDate = completionDate;
      } else {
        const diff = lastDate.getTime() - completionDate.getTime();
        const diffDays = Math.ceil(diff / (1000 * 3600 * 24));

        if (diffDays === 1) {
          streak++;
        } else if (diffDays > 1) {
          break;
        }
        lastDate = completionDate;
      }
    }
    return streak;
  }

  async getAchievementProgressForUser(userId: string): Promise<AchievementProgress[]> {
    return this.achievementRepo.findByUserId(userId);
  }
}
