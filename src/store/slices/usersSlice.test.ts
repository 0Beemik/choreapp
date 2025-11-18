
import { usersSlice, setUsers, updateUser, removeUser, addUser, setLoading, setError } from './usersSlice';
import { User } from '../../../models/User';

const initialState = {
  users: {},
  loading: false,
  error: null,
};

const user1: User = { id: 'u1', name: 'User 1', role: 'parent' };
const user2: User = { id: 'u2', name: 'User 2', role: 'child' };

describe('usersSlice', () => {
  it('should handle initial state', () => {
    expect(usersSlice.reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setUsers', () => {
    const action = setUsers([user1, user2]);
    const expectedState = { ...initialState, users: { 'u1': user1, 'u2': user2 } };
    expect(usersSlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle updateUser', () => {
    const updatedUser = { ...user1, name: 'Updated User' };
    const stateWithUser = { ...initialState, users: { 'u1': user1 } };
    const action = updateUser(updatedUser);
    const expectedState = { ...initialState, users: { 'u1': updatedUser } };
    expect(usersSlice.reducer(stateWithUser, action)).toEqual(expectedState);
  });

  it('should handle removeUser', () => {
    const stateWithUser = { ...initialState, users: { 'u1': user1 } };
    const action = removeUser('u1');
    const expectedState = { ...initialState, users: {} };
    expect(usersSlice.reducer(stateWithUser, action)).toEqual(expectedState);
  });

  it('should handle addUser', () => {
    const action = addUser(user1);
    const expectedState = { ...initialState, users: { 'u1': user1 } };
    expect(usersSlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle setLoading', () => {
    const action = setLoading(true);
    const expectedState = { ...initialState, loading: true };
    expect(usersSlice.reducer(initialState, action)).toEqual(expectedState);
  });

  it('should handle setError', () => {
    const action = setError('Test Error');
    const expectedState = { ...initialState, error: 'Test Error' };
    expect(usersSlice.reducer(initialState, action)).toEqual(expectedState);
  });
});
