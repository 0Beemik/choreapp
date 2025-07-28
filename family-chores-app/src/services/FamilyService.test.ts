import { FamilyService } from './FamilyService';
import { IFamilyRepository } from '../repositories/FamilyRepository';
import { IUserRepository } from '../repositories/UserRepository';
import { IValidationService } from './ValidationService';
import { User, Family } from '../models';
import { CreateUserRequest, UserRole } from '../types';

describe('FamilyService', () => {
  let familyService: FamilyService;
  let familyRepository: jest.Mocked<IFamilyRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let validationService: jest.Mocked<IValidationService>;

  beforeEach(() => {
    familyRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateSettings: jest.fn(),
    } as any;
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByFamilyId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    validationService = {
      validate: jest.fn(),
    } as any;

    familyService = new FamilyService(
      familyRepository,
      userRepository,
      validationService
    );
  });

  describe('createFamily', () => {
    it('should create a family and add an admin user', async () => {
      const adminUser: CreateUserRequest = {
        name: 'Admin User',
        age: 30,
        role: UserRole.PARENT,
      };
      const newFamily: Family = {
        id: 'family-1',
        name: 'The Admins',
        settings: {
          pointsPerChore: 10,
          buyoutCostPercentage: 20,
          maxBuyoutsPerMonth: 4,
          rotationDay: 'sunday',
          adminPin: '',
        },
        createdAt: new Date(),
      };
      const newUser: User = {
        id: 'user-1',
        familyId: 'family-1',
        name: 'Admin User',
        age: 30,
        role: UserRole.PARENT,
        isAdmin: true,
        allowanceRate: 0,
        preferences: {
          notifications: true,
          soundEffects: true,
          interfaceMode: 'auto',
        },
        createdAt: new Date(),
      };

      validationService.validate.mockReturnValue({ isValid: true, errors: [] });
      familyRepository.create.mockResolvedValue(newFamily);
      userRepository.create.mockResolvedValue(newUser);

      const result = await familyService.createFamily('The Admins', adminUser);

      expect(validationService.validate).toHaveBeenCalledWith(expect.any(Object), adminUser);
      expect(familyRepository.create).toHaveBeenCalledWith({
        name: 'The Admins',
        settings: {
          pointsPerChore: 10,
          buyoutCostPercentage: 20,
          maxBuyoutsPerMonth: 4,
          rotationDay: 'sunday',
          adminPin: '',
        },
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        familyId: 'family-1',
        name: 'Admin User',
        age: 30,
        role: UserRole.PARENT,
        isAdmin: true,
        allowanceRate: 0,
        preferences: {
          notifications: true,
          soundEffects: true,
          interfaceMode: 'auto',
        },
      });
      expect(result).toEqual(newFamily);
    });

    it('should throw an error if admin user data is invalid', async () => {
      const adminUser: CreateUserRequest = {
        name: 'A',
        age: -1,
        role: UserRole.PARENT,
      };
      validationService.validate.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Name must be at least 2 characters long.' }],
      });

      await expect(familyService.createFamily('The Admins', adminUser)).rejects.toThrow('Name must be at least 2 characters long.');
    });
  });

  describe('getFamilyById', () => {
    it('should return a family by id', async () => {
      const family: Family = {
        id: 'family-1',
        name: 'The Tests',
        settings: {
          pointsPerChore: 10,
          buyoutCostPercentage: 20,
          maxBuyoutsPerMonth: 4,
          rotationDay: 'saturday',
          adminPin: '1234',
        },
        createdAt: new Date(),
      };
      familyRepository.findById.mockResolvedValue(family);

      const result = await familyService.getFamilyById('family-1');

      expect(familyRepository.findById).toHaveBeenCalledWith('family-1');
      expect(result).toEqual(family);
    });
  });

  describe('updateFamilySettings', () => {
    it('should update family settings', async () => {
      const settings: Partial<Family['settings']> = {
        pointsPerChore: 20,
      };
      const updatedFamily: Family = {
        id: 'family-1',
        name: 'The Tests',
        settings: {
          pointsPerChore: 20,
          buyoutCostPercentage: 20,
          maxBuyoutsPerMonth: 4,
          rotationDay: 'saturday',
          adminPin: '1234',
        },
        createdAt: new Date(),
      };
      validationService.validate.mockReturnValue({ isValid: true, errors: [] });
      familyRepository.updateSettings.mockResolvedValue(updatedFamily);

      const result = await familyService.updateFamilySettings('family-1', settings);

      expect(validationService.validate).toHaveBeenCalledWith(expect.any(Object), settings);
      expect(familyRepository.updateSettings).toHaveBeenCalledWith('family-1', settings);
      expect(result).toEqual(updatedFamily);
    });

    it('should throw an error if settings data is invalid', async () => {
      const settings: Partial<Family['settings']> = {
        pointsPerChore: -10,
      };
      validationService.validate.mockReturnValue({
        isValid: false,
        errors: [{ field: 'pointsPerChore', message: 'Points must be positive.' }],
      });

      await expect(familyService.updateFamilySettings('family-1', settings)).rejects.toThrow('Points must be positive.');
    });
  });

  describe('addFamilyMember', () => {
    it('should add a family member', async () => {
      const newUserRequest: CreateUserRequest = {
        name: 'New Member',
        age: 10,
        role: UserRole.CHILD,
      };
      const newUser: User = {
        id: 'user-2',
        familyId: 'family-1',
        name: 'New Member',
        age: 10,
        role: UserRole.CHILD,
        isAdmin: false,
        allowanceRate: 0,
        preferences: {
          notifications: true,
          soundEffects: true,
          interfaceMode: 'auto',
        },
        createdAt: new Date(),
      };
      validationService.validate.mockReturnValue({ isValid: true, errors: [] });
      userRepository.create.mockResolvedValue(newUser);

      const result = await familyService.addFamilyMember('family-1', newUserRequest);

      expect(validationService.validate).toHaveBeenCalledWith(expect.any(Object), newUserRequest);
      expect(userRepository.create).toHaveBeenCalledWith({
        familyId: 'family-1',
        name: 'New Member',
        age: 10,
        role: UserRole.CHILD,
        isAdmin: false,
        allowanceRate: 0,
        preferences: {
          notifications: true,
          soundEffects: true,
          interfaceMode: 'auto',
        },
      });
      expect(result).toEqual(newUser);
    });

    it('should throw an error if user data is invalid', async () => {
      const newUserRequest: CreateUserRequest = {
        name: 'N',
        age: -1,
        role: UserRole.CHILD,
      };
      validationService.validate.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Name must be at least 2 characters long.' }],
      });

      await expect(familyService.addFamilyMember('family-1', newUserRequest)).rejects.toThrow('Name must be at least 2 characters long.');
    });
  });

  describe('removeFamilyMember', () => {
    it('should remove a family member', async () => {
      const adminUser: User = {
        id: 'admin-user',
        name: 'Admin',
        familyId: 'family-1',
        age: 30,
        role: UserRole.PARENT,
        isAdmin: true,
        allowanceRate: 0,
        preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' },
        createdAt: new Date(),
      };
      const userToRemove: User = {
        id: 'user-to-remove',
        name: 'Remove Me',
        familyId: 'family-1',
        age: 10,
        role: UserRole.CHILD,
        isAdmin: false,
        allowanceRate: 0,
        preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' },
        createdAt: new Date(),
      };
      userRepository.findById.mockResolvedValue(adminUser);
      userRepository.findByFamilyId.mockResolvedValue([adminUser, userToRemove]);
      userRepository.delete.mockResolvedValue(undefined);

      await familyService.removeFamilyMember('family-1', 'user-to-remove', 'admin-user');

      expect(userRepository.findById).toHaveBeenCalledWith('admin-user');
      expect(userRepository.findByFamilyId).toHaveBeenCalledWith('family-1');
      expect(userRepository.delete).toHaveBeenCalledWith('user-to-remove');
    });

    it('should throw an error if the current user is not an admin', async () => {
      const nonAdminUser: User = {
        id: 'non-admin-user',
        name: 'Non Admin',
        familyId: 'family-1',
        age: 30,
        role: UserRole.PARENT,
        isAdmin: false,
        allowanceRate: 0,
        preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' },
        createdAt: new Date(),
      };
      userRepository.findById.mockResolvedValue(nonAdminUser);

      await expect(familyService.removeFamilyMember('family-1', 'user-to-remove', 'non-admin-user')).rejects.toThrow('Only admins can remove family members.');
    });

    it('should throw an error if trying to remove the last admin', async () => {
      const adminUser: User = {
        id: 'admin-user',
        name: 'Admin',
        familyId: 'family-1',
        age: 30,
        role: UserRole.PARENT,
        isAdmin: true,
        allowanceRate: 0,
        preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' },
        createdAt: new Date(),
      };
      userRepository.findById.mockResolvedValue(adminUser);
      userRepository.findByFamilyId.mockResolvedValue([adminUser]);

      await expect(familyService.removeFamilyMember('family-1', 'admin-user', 'admin-user')).rejects.toThrow('Cannot remove the last admin of a family.');
    });
  });

  describe('validateFamilyIntegrity', () => {
    it('should return valid for a correct family', async () => {
      const family: Family = {
        id: 'family-1',
        name: 'The Tests',
        settings: {
          pointsPerChore: 10,
          buyoutCostPercentage: 20,
          maxBuyoutsPerMonth: 4,
          rotationDay: 'saturday',
          adminPin: '1234',
        },
        createdAt: new Date(),
      };
      const adminUser: User = {
        id: 'admin-user',
        name: 'Admin',
        familyId: 'family-1',
        age: 30,
        role: UserRole.PARENT,
        isAdmin: true,
        allowanceRate: 0,
        preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' },
        createdAt: new Date(),
      };
      familyRepository.findById.mockResolvedValue(family);
      userRepository.findByFamilyId.mockResolvedValue([adminUser]);

      const result = await familyService.validateFamilyIntegrity('family-1');

      expect(familyRepository.findById).toHaveBeenCalledWith('family-1');
      expect(userRepository.findByFamilyId).toHaveBeenCalledWith('family-1');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid if family not found', async () => {
      familyRepository.findById.mockResolvedValue(null);
      const result = await familyService.validateFamilyIntegrity('family-1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'family', message: 'Family not found' }]);
    });

    it('should return invalid if family has no admin', async () => {
      const family: Family = {
        id: 'family-1',
        name: 'The Tests',
        settings: {
          pointsPerChore: 10,
          buyoutCostPercentage: 20,
          maxBuyoutsPerMonth: 4,
          rotationDay: 'saturday',
          adminPin: '1234',
        },
        createdAt: new Date(),
      };
      const nonAdminUser: User = {
        id: 'non-admin-user',
        name: 'Non Admin',
        familyId: 'family-1',
        age: 30,
        role: UserRole.PARENT,
        isAdmin: false,
        allowanceRate: 0,
        preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' },
        createdAt: new Date(),
      };
      familyRepository.findById.mockResolvedValue(family);
      userRepository.findByFamilyId.mockResolvedValue([nonAdminUser]);

      const result = await familyService.validateFamilyIntegrity('family-1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'family', message: 'Family must have at least one admin' }]);
    });
  });

  describe('getFamilyMembers', () => {
    it('should return family members', async () => {
      const members: User[] = [
        { id: 'user-1', name: 'User 1', familyId: 'family-1', age: 10, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() },
        { id: 'user-2', name: 'User 2', familyId: 'family-1', age: 12, role: UserRole.CHILD, isAdmin: false, allowanceRate: 0, preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' }, createdAt: new Date() },
      ];
      userRepository.findByFamilyId.mockResolvedValue(members);

      const result = await familyService.getFamilyMembers('family-1');

      expect(userRepository.findByFamilyId).toHaveBeenCalledWith('family-1');
      expect(result).toEqual(members);
    });
  });
});