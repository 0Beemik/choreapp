import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Badge } from '../../models/Badge';

interface UiState {
  expandedUser: string | null;
  adminModalOpen: boolean;
  blurBackground: boolean;
  badgeNotification: Badge | null;
}

const initialState: UiState = {
  expandedUser: null,
  adminModalOpen: false,
  blurBackground: false,
  badgeNotification: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setExpandedUser: (state, action: PayloadAction<string | null>) => {
      state.expandedUser = action.payload;
      state.blurBackground = !!action.payload;
    },
    setAdminModalOpen: (state, action: PayloadAction<boolean>) => {
      state.adminModalOpen = action.payload;
      state.blurBackground = action.payload;
    },
    showBadgeNotification: (state, action: PayloadAction<Badge>) => {
      state.badgeNotification = action.payload;
    },
    hideBadgeNotification: (state) => {
      state.badgeNotification = null;
    },
  },
});

export const {
  setExpandedUser,
  setAdminModalOpen,
  showBadgeNotification,
  hideBadgeNotification,
} = uiSlice.actions;
