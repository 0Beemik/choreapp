import { AssignmentStatus, AssignmentType } from '../types/enums';

export interface ChoreAssignment {
  id: string;
  choreId: string;
  userId: string;
  assignmentType: AssignmentType;
  periodStart: Date;
  periodEnd: Date;
  status: AssignmentStatus;
  completedAt?: Date;
  pointsAwarded: number;
  boughtOutAt?: Date;
  pointsSpent: number;
  overrideReason?: string;
  overriddenBy?: string;
  createdAt: Date;
}
