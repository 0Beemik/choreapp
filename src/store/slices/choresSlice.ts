import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chore } from '../../../models/Chore';
import { ChoreAssignment } from '../../../models/ChoreAssignment';

interface ChoresState {
  chores: Record<string, Chore>;
  assignments: Record<string, ChoreAssignment>;
  loading: boolean;
  error: string | null;
}

const initialState: ChoresState = {
  chores: {},
  assignments: {},
  loading: false,
  error: null,
};

export const choresSlice = createSlice({
  name: 'chores',
  initialState,
  reducers: {
    setChores: (state, action: PayloadAction<Chore[]>) => {
      state.chores = action.payload.reduce((acc, chore) => {
        acc[chore.id] = chore;
        return acc;
      }, {} as Record<string, Chore>);
    },
    setAssignments: (state, action: PayloadAction<ChoreAssignment[]>) => {
      state.assignments = action.payload.reduce((acc, assignment) => {
        acc[assignment.id] = assignment;
        return acc;
      }, {} as Record<string, ChoreAssignment>);
    },
    updateAssignment: (state, action: PayloadAction<ChoreAssignment>) => {
      state.assignments[action.payload.id] = action.payload;
    },
    addChore: (state, action: PayloadAction<Chore>) => {
      state.chores[action.payload.id] = action.payload;
    },
    updateChore: (state, action: PayloadAction<Chore>) => {
      state.chores[action.payload.id] = action.payload;
    },
    removeChore: (state, action: PayloadAction<string>) => {
      // This just deactivates the chore in the state, mirroring the service logic
      if (state.chores[action.payload]) {
        state.chores[action.payload].isActive = false;
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

export const {
  setChores,
  setAssignments,
  updateAssignment,
  addChore,
  updateChore,
  removeChore,
  setLoading,
  setError,
} = choresSlice.actions;
