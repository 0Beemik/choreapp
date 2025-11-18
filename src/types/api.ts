import { UserRole } from './enums';
import { AvatarConfig } from './avatar';

export interface CreateUserRequest {
  name: string;
  age: number;
  role: UserRole;
  isAdmin?: boolean;
  allowanceRate?: number;
  avatarConfig?: AvatarConfig;
}

export interface UpdateUserRequest {
  name?: string;
  age?: number;
  role?: UserRole;
  isAdmin?: boolean;
  avatarConfig?: AvatarConfig;
  allowanceRate?: number;
}

export interface CreateChoreRequest {
  name: string;
  description: string;
  estimatedMinutes: number;
  category: string;
}

export interface UpdateChoreRequest {
  name?: string;
  description?: string;
  estimatedMinutes?: number;
  category?: string;
}