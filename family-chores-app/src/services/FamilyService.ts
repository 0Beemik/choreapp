import { z } from 'zod';
import { Family, FamilySettings } from '../models/Family';
import { User } from '../models/User';
import { CreateUserRequest, ValidationResult } from '../types';
import { IFamilyRepository, FamilyRepository } from '../repositories/FamilyRepository';
import { IUserRepository, UserRepository } from '../repositories/UserRepository';
import { IValidationService, ValidationService } from './ValidationService';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  age: z.number().min(0, 'Age cannot be negative.').max(120, 'Age seems unrealistic.'),
  role: z.string().optional(),
  isAdmin: z.boolean().optional(),
  allowanceRate: z.number().optional(),
});

const familySettingsSchema = z.object({
  pointsPerChore: z.number().positive(),
  buyoutCostPercentage: z.number().min(0).max(100),
  maxBuyoutsPerMonth: z.number().int().min(0),
  rotationDay: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
  adminPin: z.string().length(4).optional(),
});

export interface IFamilyService {
  createFamily(name: string, adminUser: CreateUserRequest): Promise<Family>;
  getFamilyById(id: string): Promise<Family | null>;
  updateFamilySettings(id: string, settings: Partial<FamilySettings>): Promise<Family>;
  addFamilyMember(familyId: string, user: CreateUserRequest): Promise<User>;
  removeFamilyMember(familyId: string, userId: string, currentUserId: string): Promise<void>;
  validateFamilyIntegrity(familyId: string): Promise<ValidationResult>;
  getFamilyMembers(familyId: string): Promise<User[]>;
}

export class FamilyService implements IFamilyService {
  constructor(
    private familyRepository: IFamilyRepository,
    private userRepository: IUserRepository,
    private validationService: IValidationService
  ) {}

  async createFamily(name: string, adminUser: CreateUserRequest): Promise<Family> {
    const validation = this.validationService.validate(createUserSchema, adminUser);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }

    const newFamily = await this.familyRepository.create({
      name,
      settings: {
        pointsPerChore: 10,
        buyoutCostPercentage: 20,
        maxBuyoutsPerMonth: 4,
        rotationDay: 'sunday',
        adminPin: '', // Admin PIN should be set up separately
      },
    });

    await this.addFamilyMember(newFamily.id, { ...adminUser, isAdmin: true });

    return newFamily;
  }

  async getFamilyById(id: string): Promise<Family | null> {
    return this.familyRepository.findById(id);
  }

  async updateFamilySettings(id: string, settings: Partial<FamilySettings>): Promise<Family> {
    const validation = this.validationService.validate(familySettingsSchema.partial(), settings);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }
    
    const family = await this.familyRepository.findById(id);
    if (!family) {
      throw new Error('Family not found.');
    }

    const updatedSettings = { ...family.settings, ...settings };
    const updatedFamily = await this.familyRepository.update(id, { settings: updatedSettings });

    return updatedFamily;
  }

  async addFamilyMember(familyId: string, userRequest: CreateUserRequest): Promise<User> {
    const validation = this.validationService.validate(createUserSchema, userRequest);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }

    const user: Omit<User, 'id' | 'createdAt'> = {
      familyId,
      name: userRequest.name,
      age: userRequest.age,
      role: userRequest.role,
      isAdmin: userRequest.isAdmin || false,
      allowanceRate: userRequest.allowanceRate || 0,
      avatarConfig: userRequest.avatarConfig,
      preferences: {
        notifications: true,
        soundEffects: true,
        interfaceMode: 'auto',
      },
    };
    return this.userRepository.create(user);
  }

  async removeFamilyMember(familyId: string, userId: string, currentUserId: string): Promise<void> {
    const currentUser = await this.userRepository.findById(currentUserId);
    if (!currentUser || !currentUser.isAdmin) {
      throw new Error('Only admins can remove family members.');
    }

    const familyMembers = await this.userRepository.findByFamilyId(familyId);
    const userToRemove = familyMembers.find(m => m.id === userId);

    if (!userToRemove) {
      throw new Error('User not found in the specified family.');
    }

    if (userToRemove.isAdmin) {
      const adminCount = familyMembers.filter(m => m.isAdmin).length;
      if (adminCount <= 1) {
        throw new Error('Cannot remove the last admin of a family.');
      }
    }

    await this.userRepository.delete(userId);
  }

  async validateFamilyIntegrity(familyId: string): Promise<ValidationResult> {
    const family = await this.familyRepository.findById(familyId);
    if (!family) {
      return { isValid: false, errors: [{ field: 'family', message: 'Family not found' }] };
    }
    const members = await this.userRepository.findByFamilyId(familyId);
    if (members.filter(m => m.isAdmin).length === 0) {
      return { isValid: false, errors: [{ field: 'family', message: 'Family must have at least one admin' }] };
    }
    return { isValid: true, errors: [] };
  }

  async getFamilyMembers(familyId: string): Promise<User[]> {
    return this.userRepository.findByFamilyId(familyId);
  }
}

