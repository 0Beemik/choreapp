import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Badge } from '../../models/Badge';
import { UserBadge } from '../../models/UserBadge';
import { AchievementProgress } from '../../models/Achievement';

interface AchievementsState {
  recentBadges: UserBadge[];
  progress: AchievementProgress[];
  celebrationQueue: Badge[];
  isLoading: boolean;
}

const initialState: AchievementsState = {
  recentBadges: [],
  progress: [],
  celebrationQueue: [],
  isLoading: false,
};

export const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    setRecentBadges: (state, action: PayloadAction<UserBadge[]>) => {
      state.recentBadges = action.payload;
    },
    setProgress: (state, action: PayloadAction<AchievementProgress[]>) => {
      state.progress = action.payload;
    },
    setCelebrationQueue: (state, action: PayloadAction<Badge[]>) => {
      state.celebrationQueue = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    showCelebration: (state, action: PayloadAction<Badge>) => {
      state.celebrationQueue.push(action.payload);
    },
    dismissCelebration: (state) => {
      state.celebrationQueue.shift();
    },
  },
});

export const {
  setRecentBadges,
  setProgress,
  setCelebrationQueue,
  setIsLoading,
  showCelebration,
  dismissCelebration,
} = achievementsSlice.actions;
