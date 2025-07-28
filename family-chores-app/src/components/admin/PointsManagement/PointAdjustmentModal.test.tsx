import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PointAdjustmentModal } from './PointAdjustmentModal';
import { User } from '../../../models';
import { UserRole } from '../../../types';

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  age: 10,
  role: UserRole.CHILD,
  isAdmin: false,
};

describe('PointAdjustmentModal', () => {
  const onSave = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not be visible when visible prop is false', () => {
    const { queryByText } = render(
      <PointAdjustmentModal
        user={mockUser}
        visible={false}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(queryByText('Adjust Points for Test User')).toBeNull();
  });

  it('should be visible when visible prop is true', () => {
    const { getByText } = render(
      <PointAdjustmentModal
        user={mockUser}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(getByText('Adjust Points for Test User')).toBeTruthy();
  });

  it('should update input fields on change', () => {
    const { getByPlaceholderText } = render(
      <PointAdjustmentModal
        user={mockUser}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const amountInput = getByPlaceholderText('Amount (e.g., 50 or -25)');
    fireEvent.changeText(amountInput, '50');
    expect(amountInput.props.value).toBe('50');

    const reasonInput = getByPlaceholderText('Reason for adjustment');
    fireEvent.changeText(reasonInput, 'Test reason');
    expect(reasonInput.props.value).toBe('Test reason');
  });

  it('should call onSave with the correct data when save button is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <PointAdjustmentModal
        user={mockUser}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Amount (e.g., 50 or -25)'), '50');
    fireEvent.changeText(getByPlaceholderText('Reason for adjustment'), 'Test reason');

    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith('user-1', 50, 'Test reason');
  });

  it('should call onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <PointAdjustmentModal
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
