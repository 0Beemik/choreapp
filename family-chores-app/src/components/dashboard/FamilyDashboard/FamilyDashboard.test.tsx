import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { FamilyDashboard } from './FamilyDashboard';
import { Family } from '../../../models/Family';
import { User } from '../../../models/User';
import { UserRole } from '../../../types';

jest.mock('../../../services/LeaderboardService', () => ({
  leaderboardService: {
    generateLeaderboard: jest.fn().mockResolvedValue([]),
  },
}));

const mockFamily: Family = {
  id: '1',
  name: 'The Test Family',
  settings: {
    pointsPerChore: 10,
    buyoutCostPercentage: 20,
    maxBuyoutsPerMonth: 4,
    rotationDay: 'sunday',
  },
  createdAt: new Date(),
};

const mockMembers: User[] = [
  {
    id: '1',
    familyId: '1',
    name: 'Parent',
    age: 35,
    role: UserRole.PARENT,
    isAdmin: true,
    allowanceRate: 0,
    preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' },
    createdAt: new Date(),
  },
  {
    id: '2',
    familyId: '1',
    name: 'Child',
    age: 10,
    role: UserRole.CHILD,
    isAdmin: false,
    allowanceRate: 1,
    preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' },
    createdAt: new Date(),
  },
];

describe('FamilyDashboard', () => {
  it('renders the family members', async () => {
    const { getByText } = render(
      <FamilyDashboard
        family={mockFamily}
        members={mockMembers}
        currentUser={mockMembers[0]}
        onUserSelect={() => {}}
        onAdminAccess={() => {}}
      />
    );

    await waitFor(() => {
      expect(getByText('P')).toBeTruthy(); // Parent initial
      expect(getByText('C')).toBeTruthy(); // Child initial
    });
  });
});
