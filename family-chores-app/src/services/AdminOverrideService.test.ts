import { AdminOverrideService as AdminOverrideServiceClass } from './AdminOverrideService';
import { pointsService } from './PointsService';
import { assignmentRepository } from '../repositories/AssignmentRepository';
import { PointTransaction } from '../models/PointTransaction';
import { ChoreAssignment } from '../models/ChoreAssignment';

jest.mock('./PointsService', () => ({
  pointsService: {
    adjustPoints: jest.fn(),
  },
}));
jest.mock('../repositories/AssignmentRepository', () => ({
  assignmentRepository: {
    findById: jest.fn(),
    update: jest.fn(),
  },
}));

describe('AdminOverrideService', () => {
  let adminOverrideService: AdminOverrideServiceClass;

  beforeEach(() => {
    jest.clearAllMocks();
    adminOverrideService = new AdminOverrideServiceClass();
  });

  describe('adjustUserPoints', () => {
    it('should adjust user points', async () => {
      const userId = 'user-1';
      const adjustment = {
        amount: 100,
        reason: 'Test adjustment',
        category: 'bonus' as const,
      };
      const transaction: PointTransaction = {
        id: 't-1',
        userId,
        amount: 100,
        reason: 'Test adjustment',
        transactionType: 'bonus',
        adminOverride: true,
        createdAt: new Date(),
      };

      (pointsService.adjustPoints as jest.Mock).mockResolvedValue(transaction);

      const result = await adminOverrideService.adjustUserPoints(userId, adjustment);

      expect(pointsService.adjustPoints).toHaveBeenCalledWith(userId, 100, 'Test adjustment', {
        adminOverride: true,
        category: 'bonus',
        note: undefined,
      });
      expect(result).toEqual(transaction);
    });
  });

  describe('overrideAssignment', () => {
    it('should override a chore assignment', async () => {
      const assignmentId = 'as-1';
      const override = {
        newStatus: 'completed' as const,
        reason: 'Test override',
      };
      const assignment: ChoreAssignment = {
        id: assignmentId,
        userId: 'user-1',
        choreId: 'chore-1',
        status: 'pending',
        familyId: 'family-1',
        periodStart: new Date(),
        periodEnd: new Date(),
        createdAt: new Date(),
      };

      (assignmentRepository.findById as jest.Mock).mockResolvedValue(assignment);
      (assignmentRepository.update as jest.Mock).mockResolvedValue({ ...assignment, status: override.newStatus });

      const result = await adminOverrideService.overrideAssignment(assignmentId, override);

      expect(assignmentRepository.findById).toHaveBeenCalledWith(assignmentId);
      expect(assignmentRepository.update).toHaveBeenCalledWith(assignmentId, {
        userId: undefined,
        status: 'completed',
        overrideReason: 'Test override',
      });
      expect(result.status).toBe('completed');
    });

    it('should throw an error if assignment is not found', async () => {
      const assignmentId = 'as-1';
      const override = {
        newStatus: 'completed' as const,
        reason: 'Test override',
      };

      (assignmentRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(adminOverrideService.overrideAssignment(assignmentId, override)).rejects.toThrow('Assignment not found');
    });
  });

  describe('activateVacationMode', () => {
    it('should activate vacation mode', async () => {
      const familyId = 'family-1';
      const period = { start: new Date(), end: new Date() };
      const result = await adminOverrideService.activateVacationMode(familyId, period);
      expect(result.familyId).toBe(familyId);
      expect(result.pauseAssignments).toBe(true);
      expect(result.pausePointsDecay).toBe(true);
    });
  });
});