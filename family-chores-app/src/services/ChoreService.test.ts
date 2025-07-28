import { ChoreService } from './ChoreService';
import { IChoreRepository } from '../repositories/ChoreRepository';
import { IAssignmentRepository } from '../repositories/AssignmentRepository';
import { IPointsService } from './PointsService';
import { Chore } from '../models/Chore';
import { ChoreAssignment } from '../models/ChoreAssignment';
import { CreateChoreRequest, UpdateChoreRequest } from '../types';

describe('ChoreService', () => {
  let choreService: ChoreService;
  let choreRepository: jest.Mocked<IChoreRepository>;
  let assignmentRepository: jest.Mocked<IAssignmentRepository>;
  let pointsService: jest.Mocked<IPointsService>;

  beforeEach(() => {
    choreRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByFamilyId: jest.fn(),
    } as any;

    assignmentRepository = {
      create: jest.fn(),
      updateStatus: jest.fn(),
      findById: jest.fn(),
      findByUserIdAndPeriod: jest.fn(),
    } as any;

    pointsService = {
      awardPoints: jest.fn(),
      deductPoints: jest.fn(),
      getCurrentPoints: jest.fn(),
    } as any;

    choreService = new ChoreService(choreRepository, assignmentRepository, pointsService);
  });

  describe('createChore', () => {
    it('should create a new chore', async () => {
      const request: CreateChoreRequest = {
        title: 'Test Chore',
        description: 'This is a test chore',
        points: 10,
        assignee: 'user-1',
      };
      const familyId = 'family-1';
      const expectedChore: Chore = {
        id: 'chore-1',
        createdAt: new Date(),
        familyId,
        ...request,
        isActive: true,
      };

      choreRepository.create.mockResolvedValue(expectedChore);

      const result = await choreService.createChore(request, familyId);

      expect(choreRepository.create).toHaveBeenCalledWith({
        familyId,
        ...request,
        isActive: true,
      });
      expect(result).toEqual(expectedChore);
    });
  });

  describe('updateChore', () => {
    it('should update an existing chore', async () => {
      const choreId = 'chore-1';
      const updates: UpdateChoreRequest = {
        title: 'Updated Chore Title',
      };
      const updatedChore: Chore = {
        id: choreId,
        createdAt: new Date(),
        familyId: 'family-1',
        title: 'Updated Chore Title',
        description: 'This is a test chore',
        points: 10,
        assignee: 'user-1',
        isActive: true,
      };

      choreRepository.update.mockResolvedValue(updatedChore);

      const result = await choreService.updateChore(choreId, updates);

      expect(choreRepository.update).toHaveBeenCalledWith(choreId, updates);
      expect(result).toEqual(updatedChore);
    });
  });

  describe('deleteChore', () => {
    it('should mark a chore as inactive', async () => {
      const choreId = 'chore-1';
      await choreService.deleteChore(choreId);
      expect(choreRepository.update).toHaveBeenCalledWith(choreId, { isActive: false });
    });
  });

  describe('completeChore', () => {
    it('should complete a chore and award points', async () => {
      const assignmentId = 'as-1';
      const userId = 'user-1';
      const assignment: ChoreAssignment = {
        id: assignmentId,
        userId,
        choreId: 'chore-1',
        status: 'pending',
        familyId: 'family-1',
        periodStart: new Date(),
        periodEnd: new Date(),
        createdAt: new Date(),
      };
      assignmentRepository.findById.mockResolvedValue(assignment);
      const result = await choreService.completeChore(assignmentId, userId);
      expect(assignmentRepository.updateStatus).toHaveBeenCalledWith(assignmentId, 'completed', 10);
      expect(pointsService.awardPoints).toHaveBeenCalledWith(userId, 10, `Completed chore: ${assignmentId}`);
      expect(result.success).toBe(true);
    });
  });

  describe('buyoutChore', () => {
    it('should buyout a chore and deduct points', async () => {
      const assignmentId = 'as-1';
      const userId = 'user-1';
      const assignment: ChoreAssignment = {
        id: assignmentId,
        userId,
        choreId: 'chore-1',
        status: 'pending',
        familyId: 'family-1',
        periodStart: new Date(),
        periodEnd: new Date(),
        createdAt: new Date(),
      };
      assignmentRepository.findById.mockResolvedValue(assignment);
      pointsService.getCurrentPoints.mockResolvedValue(100);
      const result = await choreService.buyoutChore(assignmentId, userId);
      expect(assignmentRepository.updateStatus).toHaveBeenCalledWith(assignmentId, 'bought_out', 2);
      expect(pointsService.deductPoints).toHaveBeenCalledWith(userId, 2, `Bought out of chore: ${assignmentId}`);
      expect(result.success).toBe(true);
    });
  });

  describe('getAssignmentsForUser', () => {
    it('should get all assignments for a user in a period', async () => {
      const userId = 'user-1';
      const period = { start: new Date(), end: new Date() };
      await choreService.getAssignmentsForUser(userId, period);
      expect(assignmentRepository.findByUserIdAndPeriod).toHaveBeenCalledWith(userId, period.start, period.end);
    });
  });

  describe('getChoresByFamily', () => {
    it('should get all chores for a family', async () => {
      const familyId = 'family-1';
      await choreService.getChoresByFamily(familyId);
      expect(choreRepository.findByFamilyId).toHaveBeenCalledWith(familyId);
    });
  });
});