import { UserRole } from '../types/enums';
import { AvatarConfig } from '../types/avatar';

export interface UserPreferences {
  notifications: boolean;
  soundEffects: boolean;
  interfaceMode: 'auto' | 'simple' | 'standard' | 'advanced';
}

export interface User {
  id: string;
  familyId: string;
  name: string;
  avatarConfig?: AvatarConfig;
  age: number;
  role: UserRole;
  isAdmin: boolean;
  allowanceRate: number;
  preferences: UserPreferences;
  createdAt: Date;
}
