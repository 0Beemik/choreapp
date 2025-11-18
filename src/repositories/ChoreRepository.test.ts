import { ChoreRepository } from './ChoreRepository';
import { ChoreCategory } from '../types';

describe('ChoreRepository', () => {
  let choreRepository: ChoreRepository;

  beforeEach(() => {
    choreRepository = new ChoreRepository();
  });

  describe('mapToModel', () => {
    it('should map a row to a chore model', () => {
      const row = {
        id: 'chore-1',
        family_id: 'family-1',
        name: 'Test Chore',
        description: 'This is a test chore',
        icon_name: 'test-icon',
        category: ChoreCategory.CLEANING,
        estimated_minutes: 15,
        is_active: 1,
        created_at: new Date().toISOString(),
      };

      const model = (choreRepository as any).mapToModel(row);

      expect(model.id).toBe('chore-1');
      expect(model.familyId).toBe('family-1');
      expect(model.name).toBe('Test Chore');
      expect(model.description).toBe('This is a test chore');
      expect(model.iconName).toBe('test-icon');
      expect(model.category).toBe(ChoreCategory.CLEANING);
      expect(model.estimatedMinutes).toBe(15);
      expect(model.isActive).toBe(true);
      expect(model.createdAt).toBeInstanceOf(Date);
    });
  });
});
