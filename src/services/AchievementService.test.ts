import { achievementService } from './AchievementService';
import { achievementRepository } from '../repositories/AchievementRepository';
import { badgeRepository } from '../repositories/BadgeRepository';
import { assignmentRepository } from '../repositories/AssignmentRepository';
import { pointsRepository } from '../repositories/PointsRepository';
import { badgeService } from './BadgeService';
import { Badge } from '../models/Badge';
import { ChoreAssignment } from '../models/ChoreAssignment';
import { AchievementProgress } from '../models/Achievement';

jest.mock('../repositories/AchievementRepository');
jest.mock('../repositories/BadgeRepository');
jest.mock('../repositories/AssignmentRepository');
jest.mock('../repositories/PointsRepository');
jest.mock('./BadgeService');

describe('AchievementService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update progress for all active badges for a user', async () => {
    const userId = 'user-1';
    const badges: Badge[] = [
      { id: 'badge-1', name: 'Streak', criteria: { type: 'completion_streak', threshold: 5 }, isActive: true, icon: 'streak-icon' },
      { id: 'badge-2', name: 'Points', criteria: { type: 'points_milestone', threshold: 100 }, isActive: true, icon: 'points-icon' },
      { id: 'badge-3', name: 'Inactive', criteria: { type: 'completion_streak', threshold: 3 }, isActive: false, icon: 'inactive-icon' },
    ];

    (badgeRepository.findAll as jest.Mock).mockResolvedValue(badges);
    (achievementRepository.findByUserIdAndBadgeId as jest.Mock).mockResolvedValue(null);
    (achievementRepository.create as jest.Mock).mockResolvedValue({ id: 'progress-1', userId: 'user-1', badgeId: 'badge-1', currentProgress: 0, requiredProgress: 5, progressPercentage: 0, lastUpdated: new Date() });
    (achievementRepository.update as jest.Mock).mockResolvedValue({ id: 'progress-1', userId: 'user-1', badgeId: 'badge-1', currentProgress: 1, requiredProgress: 5, progressPercentage: 20, lastUpdated: new Date() });
    (assignmentRepository.getCompletionHistory as jest.Mock).mockResolvedValue([]);
    (pointsRepository.getUserTotal as jest.Mock).mockResolvedValue(50);

    await achievementService.updateProgressForAllBadges(userId);

    expect(badgeRepository.findAll).toHaveBeenCalledTimes(1);
    expect(achievementRepository.findByUserIdAndBadgeId).toHaveBeenCalledTimes(2);
    expect(achievementRepository.create).toHaveBeenCalledTimes(2);
    expect(achievementRepository.update).toHaveBeenCalledTimes(2);
    expect(assignmentRepository.getCompletionHistory).toHaveBeenCalledTimes(1);
    expect(pointsRepository.getUserTotal).toHaveBeenCalledTimes(1);
  });

  it('should calculate streak correctly', async () => {
    const userId = 'user-1';
    const badge: Badge = { id: 'badge-1', name: 'Streak', criteria: { type: 'completion_streak', threshold: 5 }, isActive: true, icon: 'streak-icon' };
    const history: ChoreAssignment[] = [
      { id: 'ca-1', choreId: 'chore-1', userId: 'user-1', completedAt: new Date(2025, 6, 25), dueDate: new Date() },
      { id: 'ca-2', choreId: 'chore-2', userId: 'user-1', completedAt: new Date(2025, 6, 24), dueDate: new Date() },
      { id: 'ca-3', choreId: 'chore-3', userId: 'user-1', completedAt: new Date(2025, 6, 22), dueDate: new Date() }, // break in streak
      { id: 'ca-4', choreId: 'chore-4', userId: 'user-1', completedAt: new Date(2025, 6, 21), dueDate: new Date() },
    ];

    (achievementRepository.findByUserIdAndBadgeId as jest.Mock).mockResolvedValue(null);
    (achievementRepository.create as jest.Mock).mockResolvedValue({ id: 'progress-1', userId: 'user-1', badgeId: 'badge-1', currentProgress: 0, requiredProgress: 5, progressPercentage: 0, lastUpdated: new Date() });
    (assignmentRepository.getCompletionHistory as jest.Mock).mockResolvedValue(history);
    (achievementRepository.update as jest.Mock).mockImplementation(async (id, data) => ({ id, ...data }));


    await achievementService.updateProgress(userId, badge);

    expect(assignmentRepository.getCompletionHistory).toHaveBeenCalledWith(userId, 10);
    expect(achievementRepository.update).toHaveBeenCalledWith('progress-1', expect.objectContaining({
      currentProgress: 2,
      progressPercentage: 40,
    }));
  });

  it('should update progress for points milestone', async () => {
    const userId = 'user-1';
    const badge: Badge = { id: 'badge-2', name: 'Points', criteria: { type: 'points_milestone', threshold: 100 }, isActive: true, icon: 'points-icon' };
    
    (achievementRepository.findByUserIdAndBadgeId as jest.Mock).mockResolvedValue(null);
    (achievementRepository.create as jest.Mock).mockResolvedValue({ id: 'progress-2', userId: 'user-1', badgeId: 'badge-2', currentProgress: 0, requiredProgress: 100, progressPercentage: 0, lastUpdated: new Date() });
    (pointsRepository.getUserTotal as jest.Mock).mockResolvedValue(75);
    (achievementRepository.update as jest.Mock).mockImplementation(async (id, data) => ({ id, ...data }));

    await achievementService.updateProgress(userId, badge);

    expect(pointsRepository.getUserTotal).toHaveBeenCalledWith(userId);
    expect(achievementRepository.update).toHaveBeenCalledWith('progress-2', expect.objectContaining({
      currentProgress: 75,
      progressPercentage: 75,
    }));
  });

  it('should award badge for perfect week', async () => {
    const userId = 'user-1';
    const badge: Badge = { id: 'badge-3', name: 'Perfect Week', criteria: { type: 'perfect_week', threshold: 1 }, isActive: true, icon: 'perfect-week-icon' };

    (achievementRepository.findByUserIdAndBadgeId as jest.Mock).mockResolvedValue(null);
    (achievementRepository.create as jest.Mock).mockResolvedValue({ id: 'progress-3', userId: 'user-1', badgeId: 'badge-3', currentProgress: 0, requiredProgress: 1, progressPercentage: 0, lastUpdated: new Date() });
    (badgeService.checkEligibility as jest.Mock).mockResolvedValue(true);
    (achievementRepository.update as jest.Mock).mockImplementation(async (id, data) => ({ id, ...data }));

    await achievementService.updateProgress(userId, badge);

    expect(badgeService.checkEligibility).toHaveBeenCalledWith(userId, badge);
    expect(achievementRepository.update).toHaveBeenCalledWith('progress-3', expect.objectContaining({
      currentProgress: 1,
      progressPercentage: 100,
    }));
    expect(badgeService.awardBadge).toHaveBeenCalledWith(userId, badge.id);
  });

  it('should get achievement progress for a user', async () => {
    const userId = 'user-1';
    const progress: AchievementProgress[] = [
        { id: 'progress-1', userId: 'user-1', badgeId: 'badge-1', currentProgress: 2, requiredProgress: 5, progressPercentage: 40, lastUpdated: new Date() },
        { id: 'progress-2', userId: 'user-1', badgeId: 'badge-2', currentProgress: 75, requiredProgress: 100, progressPercentage: 75, lastUpdated: new Date() },
    ];

    (achievementRepository.findByUserId as jest.Mock).mockResolvedValue(progress);

    const result = await achievementService.getAchievementProgressForUser(userId);

    expect(achievementRepository.findByUserId).toHaveBeenCalledWith(userId);
    expect(result).toEqual(progress);
  });
});