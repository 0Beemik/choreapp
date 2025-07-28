export interface FamilySetupFormData {
  familyName: string;
  adminUserName: string;
  adminUserAge: number;
  pointsPerChore: number;
  buyoutCostPercentage: number;
}

export interface AddUserFormData {
  name: string;
  age: number;
  isAdmin: boolean;
  allowanceRate: number;
}

export interface CreateChoreFormData {
  name: string;
  description: string;
  category: string;
  estimatedMinutes: number;
}
