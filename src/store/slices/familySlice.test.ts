
import { familySlice, setFamily, setMembers, updateFamilySettings, setLoading, setError } from './familySlice';
import { Family } from '../../../models/Family';
import { User } from '../../../models/User';

const initialState = {
  current: null,
  members: [],
  loading: false,
  error: null,
};

const user1: User = { id: 'u1', name: 'User 1', role: 'parent' };
const user2: User = { id: 'u2', name: 'User 2', role: 'child' };
const family: Family = {
  id: 'f1',
  name: 'Test Family',
  members: [user1],
  settings: { pointsPerChore: 10, buyoutCostPercentage: 50, maxBuyoutsPerMonth: 2 },
};

describe('familySlice', () => {
  it('should handle initial state', () => {
    expect(familySlice.reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setFamily', () => {
    const action = setFamily(family);
    const expectedState = { ...initialState, current: family };
    expect(familySlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle setMembers', () => {
    const action = setMembers([user1, user2]);
    const expectedState = { ...initialState, members: [user1, user2] };
    expect(familySlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle updateFamilySettings', () => {
    const stateWithFamily = { ...initialState, current: family };
    const newSettings = { pointsPerChore: 20 };
    const action = updateFamilySettings(newSettings);
    const expectedState = {
      ...initialState,
      current: {
        ...family,
        settings: { ...family.settings, ...newSettings },
      },
    };
    expect(familySlice.reducer(stateWithFamily, action)).toEqual(expectedState);
  });

  it('should not update settings if no current family', () => {
    const newSettings = { pointsPerChore: 20 };
    const action = updateFamilySettings(newSettings);
    expect(familySlice.reducer(initialState, action)).toEqual(initialState);
  });

  it('should handle setLoading', () => {
    const action = setLoading(true);
    const expectedState = { ...initialState, loading: true };
    expect(familySlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle setError', () => {
    const action = setError('Test Error');
    const expectedState = { ...initialState, error: 'Test Error' };
    expect(familySlice.reducer(initialState, action)).toEqual(expectedState);
  });
});
