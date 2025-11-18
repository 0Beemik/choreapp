import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Family, FamilySettings } from '../../../models/Family';
import { User } from '../../../models/User';

interface FamilyState {
  current: Family | null;
  members: User[];
  loading: boolean;
  error: string | null;
}

const initialState: FamilyState = {
  current: null,
  members: [],
  loading: false,
  error: null,
};

export const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    setFamily: (state, action: PayloadAction<Family>) => {
      state.current = action.payload;
    },
    setMembers: (state, action: PayloadAction<User[]>) => {
      state.members = action.payload;
    },
    updateFamilySettings: (state, action: PayloadAction<Partial<FamilySettings>>) => {
      if (state.current) {
        state.current.settings = { ...state.current.settings, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setFamily, setMembers, updateFamilySettings, setLoading, setError } = familySlice.actions;
