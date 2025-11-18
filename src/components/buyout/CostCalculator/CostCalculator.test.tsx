import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import CostCalculator from './CostCalculator';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { User } from '../../../models/User';
import { Family } from '../../../models/Family';
import { buyoutService, BuyoutCalculation } from '../../../services/BuyoutService';
import { AssignmentStatus, UserRole } from '../../../types/enums';

jest.mock('../../../services/BuyoutService');

const mockAssignment: ChoreAssignment = {
  id: 'as-1',
  choreId: 'chore-1',
  userId: 'user-1',
  week: 1,
  status: AssignmentStatus.PENDING,
  assignedAt: new Date(),
};

const mockUser: User = {
  id: 'user-1',
  familyId: 'family-1',
  name: 'Test User',
  role: UserRole.CHILD,
  age: 10,
  totalPoints: 100,
  createdAt: new Date(),
};

const mockFamily: Family = {
  id: 'family-1',
  name: 'Test Family',
  buyoutSettings: {
    isEnabled: true,
    multiplier: 1.5,
  },
  members: [],
  admins: [],
  createdAt: new Date(),
};

const mockCalculation: BuyoutCalculation = {
  baseCost: 50,
  adjustedCost: 75,
  userBalance: 100,
  remainingBalance: 25,
  canAfford: true,
  reason: '',
};

describe('CostCalculator', () => {
  it('renders loading state initially', async () => {
    const { getByText } = render(
      <CostCalculator assignment={mockAssignment} user={mockUser} family={mockFamily} />
    );
    expect(getByText('Calculating cost...')).toBeDefined();
    await act(() => Promise.resolve());
  });

  it('renders calculated cost', async () => {
    (buyoutService.calculateBuyoutCost as jest.Mock).mockResolvedValue(mockCalculation);
    const { getByText } = render(
      <CostCalculator assignment={mockAssignment} user={mockUser} family={mockFamily} />
    );

    await waitFor(() => {
      expect(getByText('Base cost: 50 points')).toBeDefined();
      expect(getByText('Buyout cost: 75 points')).toBeDefined();
    });
    await act(() => Promise.resolve());
  });

  it('renders error if user cannot afford buyout', async () => {
    const calculationCannotAfford = { ...mockCalculation, canAfford: false };
    (buyoutService.calculateBuyoutCost as jest.Mock).mockResolvedValue(calculationCannotAfford);
    const { getByText } = render(
      <CostCalculator assignment={mockAssignment} user={mockUser} family={mockFamily} />
    );

    await waitFor(() => {
      expect(getByText("You can't afford this buyout.")).toBeDefined();
    });
    await act(() => Promise.resolve());
  });
});
