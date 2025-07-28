import { LeaderboardService } from './LeaderboardService';
import { ILeaderboardRepository } from '../repositories/LeaderboardRepository';
import { IPointsRepository } from '../repositories/PointsRepository';
import { IUserRepository } from '../repositories/UserRepository';
import { IAssignmentRepository } from '../repositories/AssignmentRepository';
import { IUserBadgeRepository } from '../repositories/UserBadgeRepository';
import { IBadgeRepository } from '../repositories/BadgeRepository';
import { User } from '../models/User';
import { PointTransaction } from '../models/PointTransaction';
import { ChoreAssignment } from '../models/ChoreAssignment';
import { LeaderboardPeriod, AssignmentStatus, AssignmentType, UserRole } from '../types';

describe('LeaderboardService', () => {
  let leaderboardService: LeaderboardService;
  let leaderboardRepository: jest.Mocked<ILeaderboardRepository>;
  let pointsRepository: jest.Mocked<IPointsRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let assignmentRepository: jest.Mocked<IAssignmentRepository>;
  let userBadgeRepository: jest.Mocked<IUserBadgeRepository>;
  let badgeRepository: jest.Mocked<IBadgeRepository>;

  beforeEach(() => {
    leaderboardRepository = {
      create: jest.fn(),
      getHistoricalRankings: jest.fn(),
    } as any;
    pointsRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
    } as any;
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByFamilyId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    assignmentRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findByUserIdAndPeriod: jest.fn(),
      findBoughtOutByDateRange: jest.fn(),
    } as any;
    userBadgeRepository = {
      findByUserIdAndPeriod: jest.fn(),
    } as any;
    badgeRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
    } as any;

    leaderboardService = new LeaderboardService(
      leaderboardRepository,
      pointsRepository,
      userRepository,
      assignmentRepository,
      userBadgeRepository,
      badgeRepository
    );
  });

  describe('generateLeaderboard', () => {
    it('should generate a leaderboard', async () => {
      const users: User[] = [
        { id: 'user-1', name: 'User 1', familyId: 'family-1', age: 10, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() },
        { id: 'user-2', name: 'User 2', familyId: 'family-1', age: 12, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() },
      ];
      const points: PointTransaction[] = [
        { id: 't-1', userId: 'user-1', amount: 100, transactionType: 'earned', description: 'Chore', createdAt: new Date() },
        { id: 't-2', userId: 'user-2', amount: 80, transactionType: 'earned', description: 'Chore', createdAt: new Date() },
      ];
      const assignments: ChoreAssignment[] = [
        { id: 'a-1', userId: 'user-1', choreId: 'chore-1', status: AssignmentStatus.COMPLETED, assignmentType: AssignmentType.WEEKLY, periodStart: new Date(), periodEnd: new Date(), createdAt: new Date() },
      ];
      userRepository.findByFamilyId.mockResolvedValue(users);
      pointsRepository.findByUserId.mockResolvedValueOnce(points.filter(p => p.userId === 'user-1'));
      pointsRepository.findByUserId.mockResolvedValueOnce(points.filter(p => p.userId === 'user-2'));
      assignmentRepository.findByUserIdAndPeriod.mockResolvedValue(assignments);
      userBadgeRepository.findByUserIdAndPeriod.mockResolvedValue([]);
      leaderboardRepository.create.mockImplementation(entry => Promise.resolve({ ...entry, id: 'entry-1', createdAt: new Date() }));

      const leaderboard = await leaderboardService.generateLeaderboard('family-1', LeaderboardPeriod.WEEKLY, new Date(), new Date());

      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].userId).toBe('user-1');
      expect(leaderboard[0].totalPoints).toBe(100);
      expect(leaderboard[1].userId).toBe('user-2');
      expect(leaderboard[1].totalPoints).toBe(80);
    });

    it('should return an empty array for a family with no users', async () => {
      userRepository.findByFamilyId.mockResolvedValue([]);
      const leaderboard = await leaderboardService.generateLeaderboard('family-1', LeaderboardPeriod.WEEKLY, new Date(), new Date());
      expect(leaderboard).toHaveLength(0);
    });
  });

  describe('awardChoreCompletionBonuses', () => {
    it('should award bonuses to users who completed all their chores', async () => {
      const users: User[] = [
        { id: 'user-1', name: 'User 1', familyId: 'family-1', age: 10, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() },
        { id: 'user-2', name: 'User 2', familyId: 'family-1', age: 12, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() },
      ];
      const assignments: ChoreAssignment[] = [
        { id: 'a-1', userId: 'user-1', choreId: 'chore-1', status: AssignmentStatus.COMPLETED, assignmentType: AssignmentType.WEEKLY, periodStart: new Date(), periodEnd: new Date(), createdAt: new Date() },
        { id: 'a-2', userId: 'user-2', choreId: 'chore-2', status: AssignmentStatus.PENDING, assignmentType: AssignmentType.WEEKLY, periodStart: new Date(), periodEnd: new Date(), createdAt: new Date() },
      ];
      userRepository.findByFamilyId.mockResolvedValue(users);
      assignmentRepository.findByUserIdAndPeriod.mockResolvedValueOnce(assignments.filter(a => a.userId === 'user-1'));
      assignmentRepository.findByUserIdAndPeriod.mockResolvedValueOnce(assignments.filter(a => a.userId === 'user-2'));
      pointsRepository.create.mockImplementation(trans => Promise.resolve({ ...trans, id: 't-1', createdAt: new Date() }));

      const transactions = await leaderboardService.awardChoreCompletionBonuses('family-1', LeaderboardPeriod.WEEKLY, new Date(), new Date());

      expect(transactions).toHaveLength(1);
      expect(transactions[0].userId).toBe('user-1');
      expect(transactions[0].amount).toBe(50);
    });

    it('should not award bonuses for a non-weekly period', async () => {
      const transactions = await leaderboardService.awardChoreCompletionBonuses('family-1', LeaderboardPeriod.MONTHLY, new Date(), new Date());
      expect(transactions).toHaveLength(0);
    });

    it('should not award a bonus to a user with no assignments', async () => {
      const users: User[] = [
        { id: 'user-1', name: 'User 1', familyId: 'family-1', age: 10, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() },
      ];
      userRepository.findByFamilyId.mockResolvedValue(users);
      assignmentRepository.findByUserIdAndPeriod.mockResolvedValue([]);
      const transactions = await leaderboardService.awardChoreCompletionBonuses('family-1', LeaderboardPeriod.WEEKLY, new Date(), new Date());
      expect(transactions).toHaveLength(0);
    });

    it('should not award a bonus to a user who has not completed all chores', async () => {
      const users: User[] = [
        { id: 'user-1', name: 'User 1', familyId: 'family-1', age: 10, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() },
      ];
      const assignments: ChoreAssignment[] = [
        { id: 'a-1', userId: 'user-1', choreId: 'chore-1', status: AssignmentStatus.PENDING, assignmentType: AssignmentType.WEEKLY, periodStart: new Date(), periodEnd: new Date(), createdAt: new Date() },
      ];
      userRepository.findByFamilyId.mockResolvedValue(users);
      assignmentRepository.findByUserIdAndPeriod.mockResolvedValue(assignments);
      const transactions = await leaderboardService.awardChoreCompletionBonuses('family-1', LeaderboardPeriod.WEEKLY, new Date(), new Date());
      expect(transactions).toHaveLength(0);
    });
  });

  describe('getHistoricalRankings', () => {
    it('should return an empty array for a user with no historical rankings', async () => {
      leaderboardRepository.getHistoricalRankings.mockResolvedValue([]);
      const rankings = await leaderboardService.getHistoricalRankings('user-1');
      expect(rankings).toHaveLength(0);
    });
  });
});