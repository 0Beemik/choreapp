import { Family } from '../models/Family';
import { User } from '../models/User';
import { Chore } from '../models/Chore';
import { ChoreAssignment } from '../models/ChoreAssignment';
import { PointTransaction } from '../models/PointTransaction';
import { LeaderboardEntry } from '../models/LeaderboardEntry';

export interface AppState {
  family: {
    current: Family | null;
    members: User[];
  };
  chores: {
    all: Chore[];
    assignments: ChoreAssignment[];
  };
  points: {
    transactions: PointTransaction[];
    leaderboard: LeaderboardEntry[];
  };
  ui: {
    isLoading: boolean;
    error: string | null;
    activeUser: string | null;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
}
