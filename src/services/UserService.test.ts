import { UserService as UserServiceClass } from './UserService';
import { IUserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { CreateUserRequest, UpdateUserRequest } from '../types';

jest.mock('../repositories/UserRepository');

describe('UserService', () => {
  let userService: UserServiceClass;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updatePreferences: jest.fn(),
      findById: jest.fn(),
      findByFamilyId: jest.fn(),
    } as any;

    userService = new UserServiceClass(userRepository);
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const request: CreateUserRequest = {
        name: 'Test User',
        age: 10,
        role: 'child',
      };
      const familyId = 'family-1';
      const expectedUser: User = {
        id: 'user-1',
        createdAt: new Date(),
        familyId,
        ...request,
        isAdmin: false,
        allowanceRate: 0,
        preferences: {
          notifications: true,
          soundEffects: true,
          interfaceMode: 'auto',
        },
      };

      userRepository.create.mockResolvedValue(expectedUser);

      const result = await userService.createUser(request, familyId);

      expect(userRepository.create).toHaveBeenCalledWith({
        familyId,
        ...request,
        isAdmin: false,
        allowanceRate: 0,
        preferences: {
          notifications: true,
          soundEffects: true,
          interfaceMode: 'auto',
        },
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const userId = 'user-1';
      const updates: UpdateUserRequest = {
        name: 'Updated User Name',
      };
      const updatedUser: User = {
        id: userId,
        createdAt: new Date(),
        familyId: 'family-1',
        name: 'Updated User Name',
        age: 10,
        role: 'child',
        isAdmin: false,
        allowanceRate: 0,
        preferences: {
          notifications: true,
          soundEffects: true,
          interfaceMode: 'auto',
        },
      };

      userRepository.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(userId, updates);

      expect(userRepository.update).toHaveBeenCalledWith(userId, updates);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userId = 'user-1';
      await userService.deleteUser(userId);
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
    });
  });

  describe('setUserAvatar', () => {
    it('should set a user avatar', async () => {
      const userId = 'user-1';
      const avatarPath = '/path/to/avatar.png';
      await userService.setUserAvatar(userId, avatarPath);
      expect(userRepository.update).toHaveBeenCalledWith(userId, { avatarPath });
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const userId = 'user-1';
      const preferences = { notifications: false };
      await userService.updateUserPreferences(userId, preferences);
      expect(userRepository.updatePreferences).toHaveBeenCalledWith(userId, preferences);
    });
  });

  describe('calculateInterfaceMode', () => {
    it('should return simple for age <= 6', () => {
      expect(userService.calculateInterfaceMode(6)).toBe('simple');
    });

    it('should return standard for age <= 12', () => {
      expect(userService.calculateInterfaceMode(12)).toBe('standard');
    });

    it('should return advanced for age > 12', () => {
      expect(userService.calculateInterfaceMode(13)).toBe('advanced');
    });
  });

  describe('validateAdminPermissions', () => {
    it('should return true for an admin user', async () => {
      const userId = 'user-1';
      const user: User = {
        id: userId,
        createdAt: new Date(),
        familyId: 'family-1',
        name: 'Admin User',
        age: 30,
        role: 'parent',
        isAdmin: true,
        allowanceRate: 0,
        preferences: {
          notifications: true,
          soundEffects: true,
          interfaceMode: 'auto',
        },
      };
      userRepository.findById.mockResolvedValue(user);
      const result = await userService.validateAdminPermissions(userId);
      expect(result).toBe(true);
    });

    it('should return false for a non-admin user', async () => {
      const userId = 'user-1';
      const user: User = {
        id: userId,
        createdAt: new Date(),
        familyId: 'family-1',
        name: 'Test User',
        age: 10,
        role: 'child',
        isAdmin: false,
        allowanceRate: 0,
        preferences: {
          notifications: true,
          soundEffects: true,
          interfaceMode: 'auto',
        },
      };
      userRepository.findById.mockResolvedValue(user);
      const result = await userService.validateAdminPermissions(userId);
      expect(result).toBe(false);
    });
  });

  describe('getUsersByFamily', () => {
    it('should get all users for a family', async () => {
      const familyId = 'family-1';
      await userService.getUsersByFamily(familyId);
      expect(userRepository.findByFamilyId).toHaveBeenCalledWith(familyId);
    });
  });
});
