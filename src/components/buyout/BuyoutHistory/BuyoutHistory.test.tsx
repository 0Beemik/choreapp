import React from 'react';
import { render } from '@testing-library/react-native';
import BuyoutHistory from './BuyoutHistory';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { AssignmentStatus } from '../../../types/enums';

const mockTransactions: ChoreAssignment[] = [
  {
    id: 'as-1',
    choreId: 'chore-1',
    userId: 'user-1',
    week: 1,
    status: AssignmentStatus.BOUGHT_OUT,
    assignedAt: new Date(),
    boughtOutAt: new Date(),
    pointsSpent: 50,
  },
  {
    id: 'as-2',
    choreId: 'chore-2',
    userId: 'user-1',
    week: 1,
    status: AssignmentStatus.BOUGHT_OUT,
    assignedAt: new Date(),
    boughtOutAt: new Date(),
    pointsSpent: 25,
  },
];

describe('BuyoutHistory', () => {
  it('renders correctly with transactions', () => {
    const { getByText } = render(<BuyoutHistory transactions={mockTransactions} />);

    expect(getByText('Buyout History')).toBeDefined();
    expect(getByText('Chore: chore-1')).toBeDefined();
    expect(getByText('Cost: 50 points')).toBeDefined();
    expect(getByText('Chore: chore-2')).toBeDefined();
    expect(getByText('Cost: 25 points')).toBeDefined();
  });

  it('renders empty message with no transactions', () => {
    const { getByText } = render(<BuyoutHistory transactions={[]} />);

    expect(getByText('Buyout History')).toBeDefined();
    expect(getByText('No buyout history.')).toBeDefined();
  });
});
