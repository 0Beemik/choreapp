import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChoreCard } from './ChoreCard';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { AssignmentStatus, AssignmentType } from '../../../types/enums';

const mockAssignment: ChoreAssignment = {
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
};

describe('ChoreCard', () => {
  it('renders the chore name', () => {
    const { getByText } = render(
      <ChoreCard assignment={mockAssignment} userAge={10} onComplete={() => {}} />
    );
    expect(getByText('Chore 1')).toBeTruthy();
  });

  it('calls onComplete when the checkbox is pressed', () => {
    const onCompleteMock = jest.fn();
    const { getByRole } = render(
      <ChoreCard
        assignment={mockAssignment}
        userAge={10}
        onComplete={onCompleteMock}
      />
    );
    fireEvent.press(getByRole('checkbox'));
    expect(onCompleteMock).toHaveBeenCalledWith('1');
  });

  it('does not show the description for young children', () => {
    const { queryByText } = render(
      <ChoreCard assignment={mockAssignment} userAge={5} onComplete={() => {}} />
    );
    expect(queryByText('Description for chore 1')).toBeNull();
  });
});
