import { AssignmentRepository } from './AssignmentRepository';
import { AssignmentStatus, AssignmentType } from '../types';

describe('AssignmentRepository', () => {
  let assignmentRepository: AssignmentRepository;
  let db: any;

  beforeEach(() => {
    db = {
      select: jest.fn(),
    };
    assignmentRepository = new AssignmentRepository();
    (assignmentRepository as any).db = db;
  });

  describe('mapToModel', () => {
    it('should map a row to an assignment model', () => {
      const row = {
        id: 'as-1',
        chore_id: 'chore-1',
        user_id: 'user-1',
        assignment_type: AssignmentType.WEEKLY,
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        status: AssignmentStatus.COMPLETED,
        completed_at: new Date().toISOString(),
        points_awarded: 10,
        created_at: new Date().toISOString(),
      };

      const model = (assignmentRepository as any).mapToModel(row);

      expect(model.id).toBe('as-1');
      expect(model.choreId).toBe('chore-1');
      expect(model.userId).toBe('user-1');
      expect(model.assignmentType).toBe(AssignmentType.WEEKLY);
      expect(model.status).toBe(AssignmentStatus.COMPLETED);
      expect(model.pointsAwarded).toBe(10);
      expect(model.completedAt).toBeInstanceOf(Date);
      expect(model.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findByUserIdAndPeriod', () => {
    it('should find assignments by user id and period', async () => {
      const userId = 'user-1';
      const periodStart = new Date();
      const periodEnd = new Date();
      const assignments = [
        { id: 'as-1', userId, periodStart, periodEnd },
      ];
      db.select.mockResolvedValue(assignments);
      (assignmentRepository as any).mapToModel = jest.fn(row => row);

      const result = await assignmentRepository.findByUserIdAndPeriod(userId, periodStart, periodEnd);

      expect(db.select).toHaveBeenCalledWith(
        'chore_assignments',
        ['user_id = ?', 'period_start >= ?', 'period_end <= ?'],
        [userId, periodStart.toISOString(), periodEnd.toISOString()]
      );
      expect(result).toEqual(assignments);
    });
  });

  describe('findBoughtOutByDateRange', () => {
    it('should find bought out assignments by date range', async () => {
      const userId = 'user-1';
      const startDate = new Date();
      const endDate = new Date();
      const assignments = [
        { id: 'as-1', userId, status: 'bought_out', boughtOutAt: startDate },
      ];
      db.select.mockResolvedValue(assignments);
      (assignmentRepository as any).mapToModel = jest.fn(row => row);

      const result = await assignmentRepository.findBoughtOutByDateRange(userId, startDate, endDate);

      expect(db.select).toHaveBeenCalledWith(
        'chore_assignments',
        ['user_id = ?', 'status = ?', 'bought_out_at >= ?', 'bought_out_at <= ?'],
        [userId, 'bought_out', startDate.toISOString(), endDate.toISOString()]
      );
      expect(result).toEqual(assignments);
    });
  });
});
