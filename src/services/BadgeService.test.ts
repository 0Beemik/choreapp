import { BadgeService as BadgeServiceClass } from './BadgeService';
import { badgeRepository } from '../repositories/BadgeRepository';
import { userBadgeRepository } from '../repositories/UserBadgeRepository';
import { assignmentRepository } from '../repositories/AssignmentRepository';
import { pointsRepository } from '../repositories/PointsRepository';
import { Badge } from '../models/Badge';
import { UserBadge } from '../models/UserBadge';

jest.mock('../store/store', () => ({
  store: {
    dispatch: jest.fn(),
  },
}));

jest.mock('../repositories/BadgeRepository', () => ({
  badgeRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../repositories/UserBadgeRepository', () => ({
  userBadgeRepository: {
    create: jest.fn(),
    findByUserId: jest.fn(),
  },
}));

jest.mock('../repositories/AssignmentRepository', () => ({
  assignmentRepository: {
    getCompletionHistory: jest.fn(),
    findByUserIdAndWeek: jest.fn(),
  },
}));

jest.mock('../repositories/PointsRepository', () => ({
  pointsRepository: {
    getUserTotal: jest.fn(),
  },
}));

describe('BadgeService', () => {
  let badgeService: BadgeServiceClass;

  beforeEach(() => {
    badgeService = new BadgeServiceClass(
      badgeRepository,
      userBadgeRepository,
      assignmentRepository,
      pointsRepository
    );
  });

  describe('awardBadge', () => {
    it('should award a badge to a user', async () => {
      const userId = 'user-1';
      const badgeId = 'badge-1';
      const badge: Badge = { id: badgeId, name: 'Test Badge', criteria: { type: 'completion_streak', threshold: 3 }, isActive: true, description: 'desc', icon: 'icon' };
      const userBadge: UserBadge = { id: 'ub-1', userId, badgeId, earnedAt: new Date() };

      (badgeRepository.findById as jest.Mock).mockResolvedValue(badge);
      (userBadgeRepository.create as jest.Mock).mockResolvedValue(userBadge);

      const result = await badgeService.awardBadge(userId, badgeId);

      expect(badgeRepository.findById).toHaveBeenCalledWith(badgeId);
      expect(userBadgeRepository.create).toHaveBeenCalledWith({
        userId,
        badgeId,
        earnedAt: expect.any(Date),
      });
      expect(result).toEqual(userBadge);
    });
  });

  describe('getUserBadges', () => {
    it('should get all badges for a user', async () => {
      const userId = 'user-1';
      const userBadges: UserBadge[] = [
        { id: 'ub-1', userId, badgeId: 'badge-1', earnedAt: new Date() },
      ];

      (userBadgeRepository.findByUserId as jest.Mock).mockResolvedValue(userBadges);

      const result = await badgeService.getUserBadges(userId);

      expect(userBadgeRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(userBadges);
    });
  });

  describe('evaluateUserBadges', () => {
    it('should award eligible badges to a user', async () => {
      const userId = 'user-1';
      const allBadges: Badge[] = [
        { id: 'badge-1', name: 'Test Badge 1', criteria: { type: 'completion_streak', threshold: 3 }, isActive: true, description: 'desc', icon: 'icon' },
        { id: 'badge-2', name: 'Test Badge 2', criteria: { type: 'points_milestone', threshold: 100 }, isActive: true, description: 'desc', icon: 'icon' },
      ];
      const userBadges: UserBadge[] = [];

      (badgeRepository.findAll as jest.Mock).mockResolvedValue(allBadges);
      (userBadgeRepository.findByUserId as jest.Mock).mockResolvedValue(userBadges);
      (badgeService as any).checkEligibility = jest.fn().mockResolvedValue(true);
      (badgeService as any).awardBadge = jest.fn();

      await badgeService.evaluateUserBadges(userId);

      expect(badgeService.checkEligibility).toHaveBeenCalledTimes(2);
      expect(badgeService.awardBadge).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkEligibility', () => {
    it('should check for completion streak', async () => {
      const userId = 'user-1';
      const badge: Badge = { id: 'badge-1', name: 'Test Badge', criteria: { type: 'completion_streak', threshold: 3 }, isActive: true, description: 'desc', icon: 'icon' };
      (assignmentRepository.getCompletionHistory as jest.Mock).mockResolvedValue([{}, {}, {}]);
      const result = await badgeService.checkEligibility(userId, badge);
      expect(result).toBe(true);
    });

    it('should check for points milestone', async () => {
      const userId = 'user-1';
      const badge: Badge = { id: 'badge-1', name: 'Test Badge', criteria: { type: 'points_milestone', threshold: 100 }, isActive: true, description: 'desc', icon: 'icon' };
      (pointsRepository.getUserTotal as jest.Mock).mockResolvedValue(100);
      const result = await badgeService.checkEligibility(userId, badge);
      expect(result).toBe(true);
    });
  });
});