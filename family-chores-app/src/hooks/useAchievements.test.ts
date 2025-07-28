import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAchievements } from './useAchievements';
import { achievementService } from '../services/AchievementService';
import { badgeService } from '../services/BadgeService';
import { Badge } from '../models/Badge';
import { UserBadge } from '../models/UserBadge';
import { AchievementProgress } from '../models/Achievement';

jest.mock('../services/AchievementService', () => ({
  achievementService: {
    getAchievementProgressForUser: jest.fn(),
  },
}));

jest.mock('../services/BadgeService', () => ({
  badgeService: {
    getUserBadges: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

const mockUserBadge: UserBadge = { id: 'ub1', userId: 'user-1', badgeId: 'b1', awardedAt: new Date().toISOString() };
const mockBadge: Badge = { id: 'b1', name: 'Test Badge', description: 'A test badge', icon: 'test-icon' };
const mockProgress: AchievementProgress = { achievementId: 'a1', progress: 50, target: 100, completed: false };

describe('useAchievements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (achievementService.getAchievementProgressForUser as jest.Mock).mockResolvedValue([mockProgress]);
    (badgeService.getUserBadges as jest.Mock).mockResolvedValue([mockUserBadge]);
  });

  it('should initialize with loading true and empty arrays', async () => {
    const { result } = renderHook(() => useAchievements('user-1'));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.recentBadges).toEqual([]);
    expect(result.current.progress).toEqual([]);
    expect(result.current.celebrationQueue).toEqual([]);
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('should fetch achievements and progress on mount', async () => {
    const { result } = renderHook(() => useAchievements('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.recentBadges).toEqual([mockUserBadge]);
      expect(result.current.progress).toEqual([mockProgress]);
    });

    expect(badgeService.getUserBadges).toHaveBeenCalledWith('user-1');
    expect(achievementService.getAchievementProgressForUser).toHaveBeenCalledWith('user-1');
    await act(() => Promise.resolve());
  });

  it('should handle errors during fetch', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (badgeService.getUserBadges as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    const { result } = renderHook(() => useAchievements('user-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh achievements:', expect.any(Error));
    consoleErrorSpy.mockRestore();
    await act(() => Promise.resolve());
  });

  it('should add a badge to the celebration queue', async () => {
    const { result } = renderHook(() => useAchievements('user-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.showCelebration(mockBadge);
    });

    expect(result.current.celebrationQueue).toEqual([mockBadge]);
    await act(() => Promise.resolve());
  });

  it('should dismiss a badge from the celebration queue', async () => {
    const { result } = renderHook(() => useAchievements('user-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.showCelebration(mockBadge);
    });

    expect(result.current.celebrationQueue).toEqual([mockBadge]);

    act(() => {
      result.current.dismissCelebration();
    });

    expect(result.current.celebrationQueue).toEqual([]);
    await act(() => Promise.resolve());
  });

  it('should refresh achievements when a badge is awarded', async () => {
    const { result } = renderHook(() => useAchievements('user-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.recentBadges).toEqual([mockUserBadge]);

    const newMockBadges = [{ ...mockUserBadge, id: 'ub2' }];
    (badgeService.getUserBadges as jest.Mock).mockResolvedValue(newMockBadges);
    
    const handleBadgeAwarded = (badgeService.on as jest.Mock).mock.calls[0][1];
    
    await act(async () => {
      await handleBadgeAwarded();
    });

    await waitFor(() => {
        expect(result.current.recentBadges).toEqual(newMockBadges)
    });
    
    expect(badgeService.getUserBadges).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
    await act(() => Promise.resolve());
  });

  it('should clean up event listener on unmount', async () => {
    const { unmount } = renderHook(() => useAchievements('user-1'));
    
    unmount();

    expect(badgeService.off).toHaveBeenCalledWith('badge:awarded', expect.any(Function));
    await act(() => Promise.resolve());
  });

  it('should not fetch if userId is not provided', async () => {
    const { result } = renderHook(() => useAchievements(''));
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(badgeService.getUserBadges).not.toHaveBeenCalled();
    expect(achievementService.getAchievementProgressForUser).not.toHaveBeenCalled();
    await act(() => Promise.resolve());
  });
});
