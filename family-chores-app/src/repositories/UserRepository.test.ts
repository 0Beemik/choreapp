import { UserRepository } from './UserRepository';

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository();
  });

  it('should map a row to a model', () => {
    const row = {
      id: '1',
      family_id: 'family-1',
      name: 'Test User',
      avatar_path: '/path/to/avatar',
      age: 10,
      role: 'child',
      is_admin: 0,
      allowance_rate: 5,
      preferences_notifications: 1,
      preferences_sound_effects: 1,
      preferences_interface_mode: 'light',
      created_at: '2025-07-26T10:00:00.000Z',
    };

    const model = (repository as any).mapToModel(row);

    expect(model).toEqual({
      id: '1',
      familyId: 'family-1',
      name: 'Test User',
      avatarPath: '/path/to/avatar',
      age: 10,
      role: 'child',
      isAdmin: false,
      allowanceRate: 5,
      createdAt: new Date('2025-07-26T10:00:00.000Z'),
      preferences: {
        notifications: true,
        soundEffects: true,
        interfaceMode: 'light',
      },
    });
  });

  it('should map a row to a model with optional fields', () => {
    const row = {
        id: '1',
        family_id: 'family-1',
        name: 'Test User',
        age: 10,
        role: 'child',
        is_admin: 0,
        allowance_rate: 5,
        preferences_notifications: 0,
        preferences_sound_effects: 0,
        preferences_interface_mode: 'dark',
        created_at: '2025-07-26T10:00:00.000Z',
      };
  
      const model = (repository as any).mapToModel(row);
  
      expect(model).toEqual({
        id: '1',
        familyId: 'family-1',
        name: 'Test User',
        avatarPath: undefined,
        age: 10,
        role: 'child',
        isAdmin: false,
        allowanceRate: 5,
        createdAt: new Date('2025-07-26T10:00:00.000Z'),
        preferences: {
          notifications: false,
          soundEffects: false,
          interfaceMode: 'dark',
        },
      });
  })
});
