import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IAchievementService } from '../services/AchievementService';
import { IBadgeService } from '../services/BadgeService';
import {
  setRecentBadges,
  setProgress,
  setCelebrationQueue,
  setIsLoading,
  showCelebration as showCelebrationAction,
  dismissCelebration as dismissCelebrationAction,
} from '../store/slices/achievementsSlice';
import { RootState } from '../store/store';
import { Badge } from '../models/Badge';

export const useAchievements = (
  achievementService: IAchievementService,
  badgeService: IBadgeService
) => {
  const dispatch = useDispatch();
  const {
    recentBadges,
    progress,
    celebrationQueue,
    isLoading,
  } = useSelector((state: RootState) => state.achievements);

  const refreshAchievements = useCallback(async (userId: string) => {
    if (!userId) {
      dispatch(setIsLoading(false));
      return;
    }
    dispatch(setIsLoading(true));
    try {
      const badges = await badgeService.getUserBadges(userId);
      dispatch(setRecentBadges(badges));
      const userProgress = await achievementService.getAchievementProgressForUser(userId);
      dispatch(setProgress(userProgress));
    } catch (error) {
      console.error("Failed to refresh achievements:", error);
    } finally {
      dispatch(setIsLoading(false));
    }
  }, [dispatch, achievementService, badgeService]);

  const showCelebration = (badge: Badge) => {
    dispatch(showCelebrationAction(badge));
  };

  const dismissCelebration = () => {
    dispatch(dismissCelebrationAction());
  };

  return {
    recentBadges,
    progress,
    celebrationQueue,
    isLoading,
    showCelebration,
    dismissCelebration,
    refreshAchievements,
  };
};