import { UserRole } from '../types/enums';

export interface UserPreferences {
  notifications: boolean;
  soundEffects: boolean;
  interfaceMode: 'auto' | 'simple' | 'standard' | 'advanced';
}

export interface User {
  id: string;
  familyId: string;
  name: string;
  avatarPath?: string;
  age: number;
  role: UserRole;
  isAdmin: boolean;
  allowanceRate: number;
  preferences: UserPreferences;
  createdAt: Date;
}
