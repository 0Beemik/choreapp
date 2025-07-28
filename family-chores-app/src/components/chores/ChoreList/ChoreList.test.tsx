import React from 'react';
import { render } from '@testing-library/react-native';
import ChoreList from './ChoreList';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { AssignmentStatus, AssignmentType } from '../../../types/enums';

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
  {
    id: '2',
    choreId: '2',
    userId: '1',
    assignmentType: AssignmentType.WEEKLY,
    periodStart: new Date(),
    periodEnd: new Date(),
    status: AssignmentStatus.COMPLETED,
    pointsAwarded: 10,
    pointsSpent: 0,
    createdAt: new Date(),
  },
];

describe('ChoreList', () => {
  it('renders a list of chores', () => {
    const { getAllByRole } = render(
      <ChoreList
        assignments={mockAssignments}
        userId="1"
        userAge={10}
        onChoreAction={() => {}}
      />
    );
    expect(getAllByRole('checkbox').length).toBe(2);
  });
});
