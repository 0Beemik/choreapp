import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Avatar } from './Avatar';
import { UserRole } from '../../../types/enums';

const mockUser = {
  id: '1',
  familyId: '1',
  name: 'Test User',
  age: 10,
  role: UserRole.CHILD,
  isAdmin: false,
  allowanceRate: 0,
  preferences: {
    notifications: true,
    soundEffects: true,
    interfaceMode: 'auto',
  },
  createdAt: new Date(),
};

describe('Avatar', () => {
  it('renders the user initial if no avatarPath is provided', () => {
    const { getByText } = render(<Avatar user={mockUser} />);
    expect(getByText('T')).toBeTruthy();
  });

  it('renders an image if avatarPath is provided', () => {
    const userWithAvatar = { ...mockUser, avatarPath: 'https://example.com/avatar.png' };
    const { getByTestId } = render(<Avatar user={userWithAvatar} />);
    // Note: We can't easily test the source of an image in react-native testing-library.
    // We would typically assign a testID to the Image component to check for its presence.
    // Let's assume the Image component has a testID of 'avatar-image'.
    // We will add this testID to the component.
    expect(getByTestId('avatar-image')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(<Avatar user={mockUser} onPress={onPressMock} />);
    fireEvent.press(getByRole('button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
