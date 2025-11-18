import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddUserModal } from './AddUserModal';
import { UserRole } from '../../../types';

describe('AddUserModal', () => {
  const onSave = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not be visible when visible prop is false', () => {
    const { queryByText } = render(
      <AddUserModal visible={false} onSave={onSave} onClose={onClose} />
    );
    expect(queryByText('Add New User')).toBeNull();
  });

  it('should be visible when visible prop is true', () => {
    const { getByText } = render(
      <AddUserModal visible={true} onSave={onSave} onClose={onClose} />
    );
    expect(getByText('Add New User')).toBeTruthy();
  });

  it('should update input fields on change', () => {
    const { getByPlaceholderText } = render(
      <AddUserModal visible={true} onSave={onSave} onClose={onClose} />
    );

    const nameInput = getByPlaceholderText('Name');
    fireEvent.changeText(nameInput, 'New User');
    expect(nameInput.props.value).toBe('New User');

    const ageInput = getByPlaceholderText('Age');
    fireEvent.changeText(ageInput, '10');
    expect(ageInput.props.value).toBe('10');
  });

  it('should call onSave with the correct data for a non-admin user', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddUserModal visible={true} onSave={onSave} onClose={onClose} />
    );

    fireEvent.changeText(getByPlaceholderText('Name'), 'New User');
    fireEvent.changeText(getByPlaceholderText('Age'), '10');

    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      name: 'New User',
      age: 10,
      role: UserRole.CHILD,
      isAdmin: false,
    });
  });

  it('should call onSave with the correct data for an admin user', () => {
    const { getByText, getByPlaceholderText, getByRole } = render(
      <AddUserModal visible={true} onSave={onSave} onClose={onClose} />
    );

    fireEvent.changeText(getByPlaceholderText('Name'), 'New Admin');
    fireEvent.changeText(getByPlaceholderText('Age'), '30');
    fireEvent(getByRole('switch'), 'onValueChange', true);


    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      name: 'New Admin',
      age: 30,
      role: UserRole.PARENT,
      isAdmin: true,
    });
  });

  it('should call onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <AddUserModal visible={true} onSave={onSave} onClose={onClose} />
    );

    fireEvent.press(getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
