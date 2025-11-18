import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DashboardScreen } from './DashboardScreen';
import { useSelector, useDispatch } from 'react-redux';
import { useFamily } from '../../hooks/useFamily';

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: {
      familyId: 'family-1',
    },
  }),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../hooks/useFamily');
jest.mock('../../hooks/useChores', () => ({
  useChores: () => ({
    assignments: [],
    completeChore: jest.fn(),
  }),
}));

jest.mock('../../components/dashboard/FamilyDashboard/FamilyDashboard', () => {
  const { Button } = require('react-native');
  return {
    FamilyDashboard: ({ onUserSelect, onAdminAccess }) => (
      <>
        <Button title="Select User" onPress={() => onUserSelect('user-1')} />
        <Button title="Admin Access" onPress={() => onAdminAccess()} />
      </>
    ),
  };
});

jest.mock('../../components/dashboard/UserColumn/UserColumn', () => {
  const { View } = require('react-native');
  return {
    UserColumn: () => <View testID="user-column" />,
  };
});

jest.mock('../../components/dashboard/BlurOverlay/BlurOverlay', () => {
  const { View } = require('react-native');
  return {
    BlurOverlay: () => <View />,
  };
});

jest.mock('../../components/achievements/BadgeNotification/BadgeNotification', () => {
  const { View } = require('react-native');
  return {
    BadgeNotification: () => <View testID="badge-notification" />,
  };
});

jest.mock('../../components/common/Loading/LoadingSpinner', () => {
  const { View } = require('react-native');
  return {
    LoadingSpinner: () => <View testID="loading-spinner" />,
  };
});

jest.mock('../../store/slices/uiSlice', () => ({
  hideBadgeNotification: jest.fn(),
  setAdminModalOpen: (isOpen) => ({ type: 'ui/setAdminModalOpen', payload: isOpen }),
}));

jest.mock('../../components/admin/AdminAuth/AdminLogin', () => {
  const { View } = require('react-native');
  return {
    AdminLogin: ({ visible }) => (visible ? <View testID="admin-login" /> : null),
  };
});

jest.mock('../../animations/AnimationController', () => ({
  animationController: {
    columns: {
      expand: jest.fn(),
      collapse: jest.fn(),
    },
  },
}));

describe('DashboardScreen', () => {
  beforeEach(() => {
    (useSelector as jest.Mock).mockReturnValue({
      badgeNotification: null,
      adminModalOpen: false,
    });
    (useFamily as jest.Mock).mockReturnValue({
      family: { id: 'family-1', name: 'Test Family' },
      members: [{ id: 'user-1', name: 'Test User' }],
      loading: false,
    });
    mockDispatch.mockClear();
  });

  it('renders without crashing', () => {
    render(<DashboardScreen />);
  });

  it('displays the loading spinner when family data is loading', () => {
    (useFamily as jest.Mock).mockReturnValue({
      family: null,
      members: [],
      loading: true,
    });
    const { getByTestId } = render(<DashboardScreen />);
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('displays the user column when a user is selected', () => {
    const { getByText, getByTestId } = render(<DashboardScreen />);
    fireEvent.press(getByText('Select User'));
    expect(getByTestId('user-column')).toBeTruthy();
  });

  it('displays the badge notification when there is a badge notification in the state', () => {
    (useSelector as jest.Mock).mockReturnValue({
      badgeNotification: { id: 'badge-1', name: 'Test Badge' },
      adminModalOpen: false,
    });
    const { getByTestId } = render(<DashboardScreen />);
    expect(getByTestId('badge-notification')).toBeTruthy();
  });

  it('opens the admin modal when the admin access button is clicked', () => {
    const { getByText } = render(<DashboardScreen />);
    fireEvent.press(getByText('Admin Access'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/setAdminModalOpen', payload: true });
  });
});
