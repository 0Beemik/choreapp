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