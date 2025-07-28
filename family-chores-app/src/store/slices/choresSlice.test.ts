
import { choresSlice, setChores, setAssignments, updateAssignment, addChore, updateChore, removeChore, setLoading, setError } from './choresSlice';
import { Chore } from '../../../models/Chore';
import { ChoreAssignment } from '../../../models/ChoreAssignment';

const initialState = {
  chores: {},
  assignments: {},
  loading: false,
  error: null,
};

const chore1: Chore = { id: '1', name: 'Test Chore 1', points: 10, isActive: true };
const chore2: Chore = { id: '2', name: 'Test Chore 2', points: 20, isActive: true };
const assignment1: ChoreAssignment = { id: 'a1', choreId: '1', userId: 'u1', completed: false, completedAt: null };
const assignment2: ChoreAssignment = { id: 'a2', choreId: '2', userId: 'u2', completed: false, completedAt: null };

describe('choresSlice', () => {
  it('should handle initial state', () => {
    expect(choresSlice.reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setChores', () => {
    const action = setChores([chore1, chore2]);
    const expectedState = { ...initialState, chores: { '1': chore1, '2': chore2 } };
    expect(choresSlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle setAssignments', () => {
    const action = setAssignments([assignment1, assignment2]);
    const expectedState = { ...initialState, assignments: { 'a1': assignment1, 'a2': assignment2 } };
    expect(choresSlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle updateAssignment', () => {
    const updatedAssignment = { ...assignment1, completed: true };
    const stateWithAssignment = { ...initialState, assignments: { 'a1': assignment1 } };
    const action = updateAssignment(updatedAssignment);
    const expectedState = { ...initialState, assignments: { 'a1': updatedAssignment } };
    expect(choresSlice.reducer(stateWithAssignment, action)).toEqual(expectedState);
  });

  it('should handle addChore', () => {
    const action = addChore(chore1);
    const expectedState = { ...initialState, chores: { '1': chore1 } };
    expect(choresSlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle updateChore', () => {
    const updatedChore = { ...chore1, name: 'Updated Chore' };
    const stateWithChore = { ...initialState, chores: { '1': chore1 } };
    const action = updateChore(updatedChore);
    const expectedState = { ...initialState, chores: { '1': updatedChore } };
    expect(choresSlice.reducer(stateWithChore, action)).toEqual(expectedState);
  });

  it('should handle removeChore', () => {
    const stateWithChore = { ...initialState, chores: { '1': chore1 } };
    const action = removeChore('1');
    const expectedState = { ...initialState, chores: { '1': { ...chore1, isActive: false } } };
    expect(choresSlice.reducer(stateWithChore, action)).toEqual(expectedState);
  });

  it('should handle setLoading', () => {
    const action = setLoading(true);
    const expectedState = { ...initialState, loading: true };
    expect(choresSlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle setError', () => {
    const action = setError('Test Error');
    const expectedState = { ...initialState, error: 'Test Error' };
    expect(choresSlice.reducer(initialState, action)).toEqual(expectedState);
  });
});
