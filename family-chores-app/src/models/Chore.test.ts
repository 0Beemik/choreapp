import { Chore } from './Chore';

describe('Chore', () => {
  it('should have the correct properties', () => {
    const chore: Chore = {
      id: '1',
      familyId: 'family-1',
      name: 'Test Chore',
      description: 'A test chore',
      iconName: 'test-icon',
      category: 'test-category',
      estimatedMinutes: 30,
      isActive: true,
      createdAt: new Date(),
    };

    expect(chore.id).toBe('1');
    expect(chore.familyId).toBe('family-1');
    expect(chore.name).toBe('Test Chore');
    expect(chore.description).toBe('A test chore');
    expect(chore.iconName).toBe('test-icon');
    expect(chore.category).toBe('test-category');
    expect(chore.estimatedMinutes).toBe(30);
    expect(chore.isActive).toBe(true);
    expect(chore.createdAt).toBeInstanceOf(Date);
  });
});
