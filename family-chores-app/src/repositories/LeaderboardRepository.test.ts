import { LeaderboardRepository } from './LeaderboardRepository';

describe('LeaderboardRepository', () => {
  let repository: LeaderboardRepository;

  beforeEach(() => {
    repository = new LeaderboardRepository();
  });

  it('should map a row to a model', () => {
    const row = {
      id: '1',
      family_id: 'family-1',
      user_id: 'user-1',
      rank: 1,
      total_points: 100,
      period: 'weekly',
      updated_at: '2025-07-26T10:00:00.000Z',
    };

    const model = (repository as any).mapToModel(row);

    expect(model).toEqual({
      id: '1',
      familyId: 'family-1',
      userId: 'user-1',
      rank: 1,
      totalPoints: 100,
      period: 'weekly',
      updatedAt: new Date('2025-07-26T10:00:00.000Z'),
    });
  });
});
