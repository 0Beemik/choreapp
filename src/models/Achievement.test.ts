import { AchievementProgress } from './Achievement';

describe('AchievementProgress', () => {
  it('should have the correct properties', () => {
    const progress: AchievementProgress = {
      id: '1',
      userId: 'user-1',
      badgeId: 'badge-1',
      currentProgress: 50,
      requiredProgress: 100,
      progressPercentage: 0.5,
      lastUpdated: new Date(),
    };

    expect(progress.id).toBe('1');
    expect(progress.userId).toBe('user-1');
    expect(progress.badgeId).toBe('badge-1');
    expect(progress.currentProgress).toBe(50);
    expect(progress.requiredProgress).toBe(100);
    expect(progress.progressPercentage).toBe(0.5);
    expect(progress.lastUpdated).toBeInstanceOf(Date);
  });
});
