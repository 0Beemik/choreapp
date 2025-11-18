import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLeaderboard } from './useLeaderboard';
import { leaderboardService } from '../services/LeaderboardService';
import { LeaderboardEntry } from '../models/LeaderboardEntry';

jest.mock('../services/LeaderboardService');

const mockLeaderboardData: LeaderboardEntry[] = [
  { userId: '1', name: 'User 1', score: 100, rank: 1 },
  { userId: '2', name: 'User 2', score: 90, rank: 2 },
];

describe('useLeaderboard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useLeaderboard(''));
    expect(result.current.leaderboard).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch leaderboard if familyId is not provided', () => {
    renderHook(() => useLeaderboard(''));
    expect(leaderboardService.generateLeaderboard).not.toHaveBeenCalled();
  });

  it('should fetch and set leaderboard data on initial load', async () => {
    (leaderboardService.generateLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboardData);
    const { result } = renderHook(() => useLeaderboard('family-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.leaderboard).toEqual(mockLeaderboardData);
    expect(result.current.error).toBeNull();
    expect(leaderboardService.generateLeaderboard).toHaveBeenCalledWith('family-1', 'weekly');
  });

  it('should handle errors during leaderboard fetch', async () => {
    (leaderboardService.generateLeaderboard as jest.Mock).mockRejectedValue(new Error('Fetch error'));
    const { result } = renderHook(() => useLeaderboard('family-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.leaderboard).toEqual([]);
    expect(result.current.error).toBe('Failed to refresh leaderboard');
  });

  it('should refresh leaderboard data when refreshLeaderboard is called', async () => {
    (leaderboardService.generateLeaderboard as jest.Mock).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useLeaderboard('family-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leaderboard).toEqual([]);

    (leaderboardService.generateLeaderboard as jest.Mock).mockResolvedValueOnce(mockLeaderboardData);

    await act(async () => {
      result.current.refreshLeaderboard();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.leaderboard).toEqual(mockLeaderboardData);
    expect(leaderboardService.generateLeaderboard).toHaveBeenCalledTimes(2);
  });

  it('should clear the error state on a successful refresh', async () => {
    (leaderboardService.generateLeaderboard as jest.Mock).mockRejectedValueOnce(new Error('Fetch error'));
    const { result } = renderHook(() => useLeaderboard('family-1'));

    await waitFor(() => expect(result.current.error).toBe('Failed to refresh leaderboard'));

    (leaderboardService.generateLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboardData);

    await act(async () => {
      result.current.refreshLeaderboard();
    });

    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.leaderboard).toEqual(mockLeaderboardData);
  });

  it('should not fetch leaderboard when refreshLeaderboard is called with an empty familyId', async () => {
    (leaderboardService.generateLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboardData);
    const { result, rerender } = renderHook(
      ({ familyId }) => useLeaderboard(familyId),
      {
        initialProps: { familyId: 'family-1' },
      },
    );

    // It's called once on initial render
    await waitFor(() =>
      expect(leaderboardService.generateLeaderboard).toHaveBeenCalledTimes(1),
    );

    rerender({ familyId: '' });

    await act(async () => {
      result.current.refreshLeaderboard();
    });

    // It should not be called again
    expect(leaderboardService.generateLeaderboard).toHaveBeenCalledTimes(1);
  });
});