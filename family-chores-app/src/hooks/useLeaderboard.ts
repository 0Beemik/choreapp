import { useState, useEffect, useCallback } from 'react';
import { LeaderboardEntry } from '../models/LeaderboardEntry';
import { ILeaderboardService } from '../services/LeaderboardService';

export const useLeaderboard = (familyId: string, leaderboardService: ILeaderboardService) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLeaderboard = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await leaderboardService.generateLeaderboard(
        familyId,
        'weekly',
      );
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to refresh leaderboard');
    } finally {
      setLoading(false);
    }
  }, [familyId, leaderboardService]);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  return { leaderboard, loading, error, refreshLeaderboard };
};