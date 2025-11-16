import { UserRole } from './enums';

export interface CreateUserRequest {
  name: string;
  age: number;
  role: UserRole;
  isAdmin?: boolean;
  allowanceRate?: number;
}

export interface UpdateUserRequest {
  name?: string;
  age?: number;
  role?: UserRole;
  isAdmin?: boolean;
  avatarPath?: string;
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