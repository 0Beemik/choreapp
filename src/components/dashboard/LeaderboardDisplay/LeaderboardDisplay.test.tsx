import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { LeaderboardDisplay } from './LeaderboardDisplay';
import { leaderboardService } from '../../../services/LeaderboardService';
import { LeaderboardEntry } from '../../../models/LeaderboardEntry';
import { LeaderboardPeriod } from '../../../types';

const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    familyId: '1',
    userId: 'user-1',
    periodType: LeaderboardPeriod.WEEKLY,
    periodStart: new Date(),
    periodEnd: new Date(),
    totalPoints: 100,
    choreCount: 5,
    position: 1,
    badgesEarned: [],
    bonusPoints: 0,
    createdAt: new Date(),
  },
  {
    id: '2',
    familyId: '1',
    userId: 'user-2',
    periodType: LeaderboardPeriod.WEEKLY,
    periodStart: new Date(),
    periodEnd: new Date(),
    totalPoints: 80,
    choreCount: 4,
    position: 2,
    badgesEarned: [],
    bonusPoints: 0,
    createdAt: new Date(),
  },
];

describe('LeaderboardDisplay', () => {
  it('fetches and displays the leaderboard', async () => {
    const spy = jest.spyOn(leaderboardService, 'generateLeaderboard').mockResolvedValue(mockLeaderboard);

    const { getByText } = render(<LeaderboardDisplay familyId="1" />);

    await waitFor(() => {
      expect(getByText('1. user-1')).toBeTruthy();
      expect(getByText('100 pts')).toBeTruthy();
      expect(getByText('2. user-2')).toBeTruthy();
      expect(getByText('80 pts')).toBeTruthy();
    });

    spy.mockRestore();
  }, 10000);
});
