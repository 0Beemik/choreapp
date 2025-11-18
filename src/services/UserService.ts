import { User, UserPreferences } from '../models/User';
import { CreateUserRequest, UpdateUserRequest } from '../types';
import { IUserRepository, UserRepository } from '../repositories/UserRepository';

type InterfaceMode = 'simple' | 'standard' | 'advanced';

export interface IUserService {
  createUser(request: CreateUserRequest, familyId: string): Promise<User>;
  updateUser(id: string, updates: UpdateUserRequest): Promise<User>;
  deleteUser(id: string): Promise<void>;
  setUserAvatar(userId: string, avatarPath: string): Promise<User>;
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User>;
  calculateInterfaceMode(age: number): InterfaceMode;
  validateAdminPermissions(userId: string): Promise<boolean>;
  getUsersByFamily(familyId: string): Promise<User[]>;
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async createUser(request: CreateUserRequest, familyId: string): Promise<User> {
    const user: Omit<User, 'id' | 'createdAt'> = {
      familyId,
      name: request.name,
      age: request.age,
      role: request.role,
      isAdmin: request.isAdmin || false,
      allowanceRate: request.allowanceRate || 0,
      preferences: {
        notifications: true,
        soundEffects: true,
        interfaceMode: 'auto',
      },
    };
    return this.userRepository.create(user);
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
    return this.userRepository.update(id, updates);
  }

  async deleteUser(id: string): Promise<void> {
    // Add checks here to prevent deleting the last admin, etc.
    return this.userRepository.delete(id);
  }

  async setUserAvatar(userId: string, avatarPath: string): Promise<User> {
    return this.userRepository.update(userId, { avatarPath });
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    const updatedPreferences = { ...user.preferences, ...preferences };
    return this.userRepository.update(userId, { preferences: updatedPreferences });
  }

  calculateInterfaceMode(age: number): InterfaceMode {
    if (age <= 6) {
      return 'simple';
    }
    if (age <= 12) {
      return 'standard';
    }
    return 'advanced';
  }

  async validateAdminPermissions(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isAdmin) {
      return false;
    }
    // In a real app, we might have more granular permissions.
    // For now, any admin can perform any admin operation.
    return true;
  }

  async getUsersByFamily(familyId: string): Promise<User[]> {
    return this.userRepository.findByFamilyId(familyId);
  }
}


