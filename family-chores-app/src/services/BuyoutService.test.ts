import { BuyoutService } from './BuyoutService';
import { IPointsService, pointsService } from './PointsService';
import { IAssignmentRepository, assignmentRepository } from '../repositories/AssignmentRepository';
import { User, ChoreAssignment, Family } from '../models';
import { UserRole, AssignmentStatus, AssignmentType } from '../types';

jest.mock('./PointsService');
jest.mock('../repositories/AssignmentRepository');

describe('BuyoutService', () => {
  let buyoutService: BuyoutService;
  let pointsServiceMock: jest.Mocked<IPointsService>;
  let assignmentRepositoryMock: jest.Mocked<IAssignmentRepository>;

  beforeEach(() => {
    pointsServiceMock = {
      getCurrentPoints: jest.fn(),
      deductPoints: jest.fn(),
    } as any;
    assignmentRepositoryMock = {
      findBoughtOutByDateRange: jest.fn(),
      update: jest.fn(),
    } as any;
    buyoutService = new BuyoutService(pointsServiceMock, assignmentRepositoryMock);
  });

  describe('calculateBuyoutCost', () => {
    it('should calculate the buyout cost correctly', async () => {
      const user: User = { id: 'user-1', name: 'Test User', familyId: 'family-1', age: 10, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() };
      const assignment: ChoreAssignment = { id: 'assign-1', choreId: 'chore-1', userId: 'user-1', status: AssignmentStatus.PENDING, assignmentType: AssignmentType.WEEKLY, periodStart: new Date(), periodEnd: new Date(), createdAt: new Date() };
      const family: Family = {
        id: 'family-1',
        name: 'Test Family',
        settings: { pointsPerChore: 100, buyoutCostPercentage: 50, maxBuyoutsPerMonth: 2, rotationDay: 'monday', adminPin: '' },
        createdAt: new Date(),
      };
      pointsServiceMock.getCurrentPoints.mockResolvedValue(200);

      const result = await buyoutService.calculateBuyoutCost(user, assignment, family);

      expect(result.baseCost).toBe(100);
      expect(result.adjustedCost).toBe(50);
      expect(result.canAfford).toBe(true);
      expect(result.remainingBalance).toBe(150);
    });
  });

  describe('validateBuyoutEligibility', () => {
    it('should return eligible if user can afford and has not reached the limit', async () => {
      const user: User = { id: 'user-1', name: 'Test User', familyId: 'family-1', age: 10, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() };
      const assignment: ChoreAssignment = { id: 'assign-1', choreId: 'chore-1', userId: 'user-1', status: AssignmentStatus.PENDING, assignmentType: AssignmentType.WEEKLY, periodStart: new Date(), periodEnd: new Date(), createdAt: new Date() };
      const family: Family = {
        id: 'family-1',
        name: 'Test Family',
        settings: { pointsPerChore: 100, buyoutCostPercentage: 50, maxBuyoutsPerMonth: 2, rotationDay: 'monday', adminPin: '' },
        createdAt: new Date(),
      };
      pointsServiceMock.getCurrentPoints.mockResolvedValue(200);
      assignmentRepositoryMock.findBoughtOutByDateRange.mockResolvedValue([]);

      const result = await buyoutService.validateBuyoutEligibility(user, assignment, family);

      expect(result.isEligible).toBe(true);
    });
  });

  describe('processBuyout', () => {
    it('should process the buyout if user is eligible', async () => {
      const user: User = { id: 'user-1', name: 'Test User', familyId: 'family-1', age: 10, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() };
      const assignment: ChoreAssignment = { id: 'assign-1', choreId: 'chore-1', userId: 'user-1', status: AssignmentStatus.PENDING, assignmentType: AssignmentType.WEEKLY, periodStart: new Date(), periodEnd: new Date(), createdAt: new Date() };
      const family: Family = {
        id: 'family-1',
        name: 'Test Family',
        settings: { pointsPerChore: 100, buyoutCostPercentage: 50, maxBuyoutsPerMonth: 2, rotationDay: 'monday', adminPin: '' },
        createdAt: new Date(),
      };
      pointsServiceMock.getCurrentPoints.mockResolvedValue(200);
      assignmentRepositoryMock.findBoughtOutByDateRange.mockResolvedValue([]);
      pointsServiceMock.deductPoints.mockResolvedValue({} as any);
      assignmentRepositoryMock.update.mockResolvedValue({} as any);

      await buyoutService.processBuyout(user, assignment, family);

      expect(pointsServiceMock.deductPoints).toHaveBeenCalledWith('user-1', 50, 'Buyout for chore: assign-1');
      expect(assignmentRepositoryMock.update).toHaveBeenCalledWith('assign-1', {
        status: 'bought_out',
        boughtOutAt: expect.any(Date),
        pointsSpent: 50,
      });
    });
  });
});
