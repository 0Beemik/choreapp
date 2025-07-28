import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { BuyoutIndicator } from './BuyoutIndicator';
import { User } from '../../../models/User';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { buyoutService } from '../../../services/BuyoutService';
import { familyService } from '../../../services/FamilyService';
import { AssignmentStatus, UserRole } from '../../../types/enums';

jest.mock('../../../services/BuyoutService');
jest.mock('../../../services/FamilyService');

const mockUser: User = {
  id: 'user-1',
  familyId: 'family-1',
  name: 'Test User',
  role: UserRole.CHILD,
  age: 10,
  totalPoints: 100,
  createdAt: new Date(),
};

const mockAssignment: ChoreAssignment = {
  id: 'as-1',
  choreId: 'chore-1',
  userId: 'user-1',
  week: 1,
  status: AssignmentStatus.PENDING,
  assignedAt: new Date(),
};

describe('BuyoutIndicator', () => {
  it('shows loading indicator initially', async () => {
    const { getByTestId } = render(
      <BuyoutIndicator user={mockUser} assignment={mockAssignment} />
    );
    expect(getByTestId('loading-indicator')).toBeDefined();
    await act(() => Promise.resolve());
  });

  it('displays buyout cost on successful fetch', async () => {
    (familyService.getFamilyById as jest.Mock).mockResolvedValue({ id: 'family-1' });
    (buyoutService.calculateBuyoutCost as jest.Mock).mockResolvedValue({ adjustedCost: 50 });

    const { getByText } = render(
      <BuyoutIndicator user={mockUser} assignment={mockAssignment} />
    );

    await waitFor(() => {
      expect(getByText('Buyout Cost: 50 points')).toBeDefined();
    });
    await act(() => Promise.resolve());
  });

  it('shows not available message on fetch error', async () => {
    (familyService.getFamilyById as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    const { getByText } = render(
      <BuyoutIndicator user={mockUser} assignment={mockAssignment} />
    );

    await waitFor(() => {
      expect(getByText('Buyout not available')).toBeDefined();
    });
    await act(() => Promise.resolve());
  });
});
