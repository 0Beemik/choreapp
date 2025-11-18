import React from 'react';
import { render } from '@testing-library/react-native';
import { UserColumn } from './UserColumn';
import { User } from '../../../models/User';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { AssignmentStatus, AssignmentType, UserRole } from '../../../types/enums';

const mockUser: User = {
  id: '1',
  familyId: '1',
  name: 'Test User',
  age: 10,
  role: UserRole.CHILD,
  isAdmin: false,
  allowanceRate: 0,
  preferences: { notifications: true, soundEffects: true, interfaceMode: 'auto' },
  createdAt: new Date(),
};

const mockAssignments: ChoreAssignment[] = [
  {
    id: '1',
    choreId: '1',
    userId: '1',
    assignmentType: AssignmentType.WEEKLY,
    periodStart: new Date(),
    periodEnd: new Date(),
    status: AssignmentStatus.PENDING,
    pointsAwarded: 0,
    pointsSpent: 0,
    createdAt: new Date(),
  },
];

describe('UserColumn', () => {
  it('renders the user name and their chores', () => {
    const { getByText, getAllByRole } = render(
      <UserColumn
        user={mockUser}
        assignments={mockAssignments}
        isExpanded={true}
        onToggle={() => {}}
        onChoreComplete={() => {}}
        onBuyout={() => {}}
      />
    );
    expect(getByText('Test User')).toBeTruthy();
    expect(getAllByRole('checkbox').length).toBe(1);
  });
});
