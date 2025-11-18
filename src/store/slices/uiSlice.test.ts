import { uiSlice, setExpandedUser, setAdminModalOpen, showBadgeNotification, hideBadgeNotification } from './uiSlice';
import { Badge } from '../../models/Badge';

describe('uiSlice', () => {
  const initialState = {
    expandedUser: null,
    adminModalOpen: false,
    blurBackground: false,
    badgeNotification: null,
  };

  it('should handle initial state', () => {
    expect(uiSlice.reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setExpandedUser', () => {
    const state = uiSlice.reducer(initialState, setExpandedUser('user-1'));
    expect(state.expandedUser).toEqual('user-1');
    expect(state.blurBackground).toEqual(true);
  });

  it('should handle setAdminModalOpen', () => {
    const state = uiSlice.reducer(initialState, setAdminModalOpen(true));
    expect(state.adminModalOpen).toEqual(true);
    expect(state.blurBackground).toEqual(true);
  });

  it('should handle showBadgeNotification', () => {
    const badge: Badge = { id: 'badge-1', name: 'Test Badge', description: 'Test Badge', icon: 'test-icon' };
    const state = uiSlice.reducer(initialState, showBadgeNotification(badge));
    expect(state.badgeNotification).toEqual(badge);
  });

  it('should handle hideBadgeNotification', () => {
    const stateWithBadge = { ...initialState, badgeNotification: { id: 'badge-1', name: 'Test Badge', description: 'Test Badge', icon: 'test-icon' } };
    const state = uiSlice.reducer(stateWithBadge, hideBadgeNotification());
    expect(state.badgeNotification).toBeNull();
  });
});
