import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BuyoutDialog from './BuyoutDialog';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { BuyoutCalculation } from '../../../services/BuyoutService';
import { AssignmentStatus } from '../../../types/enums';

const mockAssignment: ChoreAssignment = {
  id: 'as-1',
  choreId: 'chore-1',
  userId: 'user-1',
  week: 1,
  status: AssignmentStatus.PENDING,
  assignedAt: new Date(),
};

const mockCalculation: BuyoutCalculation = {
  adjustedCost: 50,
  userBalance: 100,
  remainingBalance: 50,
  canAfford: true,
  reason: '',
};

describe('BuyoutDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  it('renders correctly when user can afford buyout', () => {
    const { getByText, getByRole } = render(
      <BuyoutDialog
        assignment={mockAssignment}
        calculation={mockCalculation}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        visible={true}
      />
    );

    expect(getByText('Buyout Chore?')).toBeDefined();
    expect(getByText('Chore: as-1')).toBeDefined();
    expect(getByText('Cost: 50 points')).toBeDefined();
    expect(getByText('Your balance: 100 points')).toBeDefined();
    expect(getByText('Remaining balance: 50 points')).toBeDefined();
    const confirmButton = getByRole('button', { name: 'Confirm' });
    expect(confirmButton.props.accessibilityState.disabled).toBe(false);
  });

  it('disables confirm button when user cannot afford buyout', () => {
    const calculationCannotAfford = { ...mockCalculation, canAfford: false };
    const { getByRole } = render(
      <BuyoutDialog
        assignment={mockAssignment}
        calculation={calculationCannotAfford}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        visible={true}
      />
    );
    const confirmButton = getByRole('button', { name: 'Confirm' });
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
  });

  it('calls onConfirm when confirm button is pressed', () => {
    const { getByText } = render(
      <BuyoutDialog
        assignment={mockAssignment}
        calculation={mockCalculation}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        visible={true}
      />
    );

    fireEvent.press(getByText('Confirm'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <BuyoutDialog
        assignment={mockAssignment}
        calculation={mockCalculation}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        visible={true}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
