import { UserBadgeRepository } from './UserBadgeRepository';
import { dbConnection } from '../database/connection';

jest.mock('../database/connection', () => ({
  dbConnection: {
    query: jest.fn(),
  },
}));

describe('UserBadgeRepository', () => {
  let repository: UserBadgeRepository;

  beforeEach(() => {
    repository = new UserBadgeRepository();
    (dbConnection.query as jest.Mock).mockClear();
  });

  it('should map a row to a model', () => {
    const row = {
      id: '1',
      user_id: 'user-1',
      badge_id: 'badge-1',
      earned_at: '2025-07-26T10:00:00.000Z',
    };

    const model = (repository as any).mapToModel(row);

    expect(model).toEqual({
      id: '1',
      userId: 'user-1',
      badgeId: 'badge-1',
      earnedAt: new Date('2025-07-26T10:00:00.000Z'),
    });
  });

  it('should find badges by user id and period', async () => {
    const rows = [
      {
        id: '1',
        user_id: 'user-1',
        badge_id: 'badge-1',
        earned_at: '2025-07-26T10:00:00.000Z',
      },
    ];
    (dbConnection.query as jest.Mock).mockResolvedValue(rows);

    const startDate = new Date('2025-07-01T00:00:00.000Z');
    const endDate = new Date('2025-07-31T23:59:59.999Z');
    const result = await repository.findByUserIdAndPeriod('user-1', startDate, endDate);

    expect(result).toEqual([
      {
        id: '1',
        userId: 'user-1',
        badgeId: 'badge-1',
        earnedAt: new Date('2025-07-26T10:00:00.000Z'),
      },
    ]);
    expect(dbConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM user_badges WHERE user_id = ? AND earned_at BETWEEN ? AND ?;',
      ['user-1', startDate.toISOString(), endDate.toISOString()]
    );
  });
});
