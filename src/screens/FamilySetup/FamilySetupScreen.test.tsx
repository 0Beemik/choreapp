import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { FamilySetupScreen } from './FamilySetupScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockCreateFamily = jest.fn().mockResolvedValue({ id: 'new-family-id' });
jest.mock('../../hooks/useFamily', () => ({
  useFamily: () => ({
    createFamily: mockCreateFamily,
    loading: false,
  }),
}));

jest.mock('../../components/common/Input/Input', () => {
  const { TextInput } = require('react-native');
  return {
    Input: (props) => <TextInput {...props} />,
  };
});

describe('FamilySetupScreen', () => {
  it('renders correctly', async () => {
    render(<FamilySetupScreen />);
    await act(() => Promise.resolve());
  });

  it('calls createFamily and navigates on setup', async () => {
    const { getByText, getByPlaceholderText } = render(<FamilySetupScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., The Smiths'), 'Test Family');
    fireEvent.changeText(getByPlaceholderText('e.g., John Doe'), 'Test Admin');
    fireEvent.changeText(getByPlaceholderText('e.g., 35'), '30');

    await act(async () => {
      fireEvent.press(getByText('Create Family'));
    });

    expect(mockCreateFamily).toHaveBeenCalledWith(
      'Test Family',
      {
        name: 'Test Admin',
        age: 30,
        role: 'parent',
        isAdmin: true,
      }
    );
    expect(mockNavigate).toHaveBeenCalledWith('Dashboard', { familyId: 'new-family-id' });
    await act(() => Promise.resolve());
  });
});
