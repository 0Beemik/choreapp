import { PointsRepository } from './PointsRepository';

describe('PointsRepository', () => {
  let repository: PointsRepository;

  beforeEach(() => {
    repository = new PointsRepository();
  });

  it('should map a row to a model', () => {
    const row = {
      id: '1',
      user_id: 'user-1',
      assignment_id: 'as-1',
      transaction_type: 'chore_completion',
      amount: 10,
      reason: 'Completed chore',
      badge_earned: 'badge-1',
      leaderboard_position: 1,
      admin_override: 0,
      created_at: '2025-07-26T10:00:00.000Z',
    };

    const model = (repository as any).mapToModel(row);

    expect(model).toEqual({
      id: '1',
      userId: 'user-1',
      assignmentId: 'as-1',
      transactionType: 'chore_completion',
      amount: 10,
      reason: 'Completed chore',
      badgeEarned: 'badge-1',
      leaderboardPosition: 1,
      adminOverride: false,
      createdAt: new Date('2025-07-26T10:00:00.000Z'),
    });
  });

  it('should map a row to a model with optional fields', () => {
    const row = {
      id: '1',
      user_id: 'user-1',
      transaction_type: 'bonus',
      amount: 100,
      admin_override: 1,
      created_at: '2025-07-26T10:00:00.000Z',
    };

    const model = (repository as any).mapToModel(row);

    expect(model).toEqual({
      id: '1',
      userId: 'user-1',
      assignmentId: undefined,
      transactionType: 'bonus',
      amount: 100,
      reason: undefined,
      badgeEarned: undefined,
      leaderboardPosition: undefined,
      adminOverride: true,
      createdAt: new Date('2025-07-26T10:00:00.000Z'),
    });
  });
});
