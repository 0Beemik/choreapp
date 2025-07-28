export interface Chore {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  iconName?: string;
  category?: string;
  estimatedMinutes?: number;
  isActive: boolean;
  createdAt: Date;
}
