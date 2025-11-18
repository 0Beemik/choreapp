import { BadgeRepository } from './BadgeRepository';
import { dbConnection } from '../database/connection';

jest.mock('../database/connection', () => ({
  dbConnection: {
    query: jest.fn(),
  },
}));

describe('BadgeRepository', () => {
  let repository: BadgeRepository;

  beforeEach(() => {
    repository = new BadgeRepository();
    (dbConnection.query as jest.Mock).mockClear();
  });

  it('should map a row to a model', () => {
    const row = {
      id: '1',
      name: 'Test Badge',
      description: 'Test Description',
      icon_path: '/path/to/icon',
      category: 'completion',
      criteria: JSON.stringify({ type: 'completion_streak', threshold: 3 }),
      bonus_points: 10,
      rarity: 'common',
      is_active: 1,
      created_at: '2025-07-26T10:00:00.000Z',
    };

    const model = (repository as any).mapToModel(row);

    expect(model).toEqual({
      id: '1',
      name: 'Test Badge',
      description: 'Test Description',
      iconPath: '/path/to/icon',
      category: 'completion',
      criteria: { type: 'completion_streak', threshold: 3 },
      bonusPoints: 10,
      rarity: 'common',
      isActive: true,
      createdAt: new Date('2025-07-26T10:00:00.000Z'),
    });
  });

  it('should find a badge by name', async () => {
    const row = {
      id: '1',
      name: 'Test Badge',
      description: 'Test Description',
      icon_path: '/path/to/icon',
      category: 'completion',
      criteria: JSON.stringify({ type: 'completion_streak', threshold: 3 }),
      bonus_points: 10,
      rarity: 'common',
      is_active: 1,
      created_at: '2025-07-26T10:00:00.000Z',
    };
    (dbConnection.query as jest.Mock).mockResolvedValue([row]);

    const result = await repository.findByName('Test Badge');

    expect(result).toEqual({
      id: '1',
      name: 'Test Badge',
      description: 'Test Description',
      iconPath: '/path/to/icon',
      category: 'completion',
      criteria: { type: 'completion_streak', threshold: 3 },
      bonusPoints: 10,
      rarity: 'common',
      isActive: true,
      createdAt: new Date('2025-07-26T10:00:00.000Z'),
    });
    expect(dbConnection.query).toHaveBeenCalledWith(
      'SELECT * FROM badges WHERE name = ?;',
      ['Test Badge']
    );
  });

  it('should return null if badge not found by name', async () => {
    (dbConnection.query as jest.Mock).mockResolvedValue([]);
    const result = await repository.findByName('Test Badge');
    expect(result).toBeNull();
  });
});
