import { AchievementRepository } from './AchievementRepository';

describe('AchievementRepository', () => {
  let repository: AchievementRepository;

  beforeEach(() => {
    repository = new AchievementRepository();
  });

  it('should map a row to a model', () => {
    const row = {
      id: '1',
      user_id: 'user-1',
      badge_id: 'badge-1',
      current_progress: 5,
      required_progress: 10,
      progress_percentage: 50,
      estimated_completion: '2025-07-27T10:00:00.000Z',
      last_updated: '2025-07-26T10:00:00.000Z',
    };

    const model = (repository as any).mapToModel(row);

    expect(model).toEqual({
      id: '1',
      userId: 'user-1',
      badgeId: 'badge-1',
      currentProgress: 5,
      requiredProgress: 10,
      progressPercentage: 50,
      estimatedCompletion: new Date('2025-07-27T10:00:00.000Z'),
      lastUpdated: new Date('2025-07-26T10:00:00.000Z'),
    });
  });

  it('should map a row to a model without estimated completion', () => {
    const row = {
      id: '1',
      user_id: 'user-1',
      badge_id: 'badge-1',
      current_progress: 5,
      required_progress: 10,
      progress_percentage: 50,
      last_updated: '2025-07-26T10:00:00.000Z',
    };

    const model = (repository as any).mapToModel(row);

    expect(model).toEqual({
      id: '1',
      userId: 'user-1',
      badgeId: 'badge-1',
      currentProgress: 5,
      requiredProgress: 10,
      progressPercentage: 50,
      estimatedCompletion: undefined,
      lastUpdated: new Date('2025-07-26T10:00:00.000Z'),
    });
  });
});
