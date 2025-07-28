export interface FamilySettings {
  pointsPerChore: number;
  buyoutCostPercentage: number;
  maxBuyoutsPerMonth: number;
  rotationDay: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  adminPin: string; // Should be a bcrypt hash
}

export interface Family {
  id: string;
  name: string;
  settings: FamilySettings;
  createdAt: Date;
}
