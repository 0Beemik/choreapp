import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PointTransaction } from '../../../models/PointTransaction';
import { LeaderboardEntry } from '../../../models/LeaderboardEntry';

interface PointsState {
  transactions: PointTransaction[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: PointsState = {
  transactions: [],
  leaderboard: [],
  loading: false,
  error: null,
};

export const pointsSlice = createSlice({
  name: 'points',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<PointTransaction[]>) => {
      state.transactions = action.payload;
    },
    addTransaction: (state, action: PayloadAction<PointTransaction>) => {
      state.transactions.push(action.payload);
    },
    setLeaderboard: (state, action: PayloadAction<LeaderboardEntry[]>) => {
      state.leaderboard = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setTransactions, addTransaction, setLeaderboard, setLoading, setError } = pointsSlice.actions;
