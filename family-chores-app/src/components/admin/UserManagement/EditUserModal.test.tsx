import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EditUserModal } from './EditUserModal';
import { User } from '../../../models';
import { UserRole } from '../../../types';

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  age: 10,
  role: UserRole.CHILD,
  isAdmin: false,
};

describe('EditUserModal', () => {
  const onSave = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not be visible when visible prop is false', () => {
    const { queryByText } = render(
      <EditUserModal
        user={mockUser}
        visible={false}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(queryByText('Edit User')).toBeNull();
  });

  it('should be visible when visible prop is true', () => {
    const { getByText } = render(
      <EditUserModal
        user={mockUser}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(getByText('Edit User')).toBeTruthy();
  });

  it('should pre-fill the input fields with user data', () => {
    const { getByPlaceholderText } = render(
      <EditUserModal
        user={mockUser}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    expect(getByPlaceholderText('Name').props.value).toBe('Test User');
    expect(getByPlaceholderText('Age').props.value).toBe('10');
  });

  it('should update input fields on change', () => {
    const { getByPlaceholderText } = render(
      <EditUserModal
        user={mockUser}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const nameInput = getByPlaceholderText('Name');
    fireEvent.changeText(nameInput, 'Updated User');
    expect(nameInput.props.value).toBe('Updated User');
  });

  it('should call onSave with the correct data when save button is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <EditUserModal
        user={mockUser}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Name'), 'Updated User');
    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith('user-1', {
      name: 'Updated User',
      age: 10,
      isAdmin: false,
    });
  });

  it('should call onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <EditUserModal
        user={mockUser}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
