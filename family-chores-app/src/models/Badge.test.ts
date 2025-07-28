import { Badge, BadgeCriteria } from './Badge';
import { BadgeCategory, Rarity } from '../types';

describe('Badge', () => {
  it('should have the correct properties', () => {
    const criteria: BadgeCriteria = {
      type: 'completion_streak',
      threshold: 5,
      period: 'weekly',
      consecutiveRequired: true,
    };

    const badge: Badge = {
      id: '1',
      name: 'Test Badge',
      description: 'A test badge',
      iconPath: '/path/to/icon',
      category: BadgeCategory.Chores,
      criteria,
      bonusPoints: 100,
      rarity: Rarity.Common,
      isActive: true,
      createdAt: new Date(),
    };

    expect(badge.id).toBe('1');
    expect(badge.name).toBe('Test Badge');
    expect(badge.description).toBe('A test badge');
    expect(badge.iconPath).toBe('/path/to/icon');
    expect(badge.category).toBe(BadgeCategory.Chores);
    expect(badge.criteria).toEqual(criteria);
    expect(badge.bonusPoints).toBe(100);
    expect(badge.rarity).toBe(Rarity.Common);
    expect(badge.isActive).toBe(true);
    expect(badge.createdAt).toBeInstanceOf(Date);
  });
});
