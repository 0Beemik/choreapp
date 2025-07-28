import { LeaderboardEntry } from '../models/LeaderboardEntry';
import { BaseRepository } from './BaseRepository';

interface LeaderboardRow {
  id: string;
  family_id: string;
  user_id: string;
  rank: number;
  total_points: number;
  period: 'daily' | 'weekly' | 'monthly';
  updated_at: string;
}

export class LeaderboardRepository extends BaseRepository<LeaderboardEntry> {
  protected tableName = 'leaderboard';

  protected mapToModel(row: unknown): LeaderboardEntry {
    const typedRow = row as LeaderboardRow;
    return {
      id: typedRow.id,
      familyId: typedRow.family_id,
      userId: typedRow.user_id,
      rank: typedRow.rank,
      totalPoints: typedRow.total_points,
      period: typedRow.period,
      updatedAt: new Date(typedRow.updated_at),
    };
  }
  // ... (rest of the class remains the same)
}
