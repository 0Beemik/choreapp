import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChoreManagementPanel } from './ChoreManagementPanel';
import { Chore, ChoreAssignment } from '../../../models';

const mockChores: Chore[] = [
  { id: 'chore-1', name: 'Test Chore 1', points: 10, isBlocking: false, isComplete: false, description: 'description' },
  { id: 'chore-2', name: 'Test Chore 2', points: 20, isBlocking: false, isComplete: false, description: 'description' },
];

const mockAssignments: ChoreAssignment[] = [
  { id: 'as-1', choreId: 'chore-1', userId: 'user-1', isComplete: false, dueDate: new Date() },
  { id: 'as-2', choreId: 'chore-2', userId: 'user-2', isComplete: false, dueDate: new Date() },
];

describe('ChoreManagementPanel', () => {
  const onChoreCreate = jest.fn();
  const onChoreEdit = jest.fn();
  const onAssignmentOverride = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the list of chores and assignments', () => {
    const { getByText } = render(
      <ChoreManagementPanel
        chores={mockChores}
        assignments={mockAssignments}
        onChoreCreate={onChoreCreate}
        onChoreEdit={onChoreEdit}
        onAssignmentOverride={onAssignmentOverride}
      />
    );

    expect(getByText('Test Chore 1')).toBeTruthy();
    expect(getByText('Test Chore 2')).toBeTruthy();
    expect(getByText('Chore: chore-1 - User: user-1')).toBeTruthy();
    expect(getByText('Chore: chore-2 - User: user-2')).toBeTruthy();
  });

  it('should call onChoreCreate when the "Add Chore" button is pressed', () => {
    const { getByText } = render(
      <ChoreManagementPanel
        chores={mockChores}
        assignments={mockAssignments}
        onChoreCreate={onChoreCreate}
        onChoreEdit={onChoreEdit}
        onAssignmentOverride={onAssignmentOverride}
      />
    );

    fireEvent.press(getByText('Add Chore'));
    expect(onChoreCreate).toHaveBeenCalled();
  });

  it('should call onChoreEdit with the correct chore when the "Edit" button is pressed', () => {
    const { getAllByText } = render(
      <ChoreManagementPanel
        chores={mockChores}
        assignments={mockAssignments}
        onChoreCreate={onChoreCreate}
        onChoreEdit={onChoreEdit}
        onAssignmentOverride={onAssignmentOverride}
      />
    );

    fireEvent.press(getAllByText('Edit')[0]);
    expect(onChoreEdit).toHaveBeenCalledWith(mockChores[0]);
  });

  it('should call onAssignmentOverride with the correct assignment when the "Override" button is pressed', () => {
    const { getAllByText } = render(
      <ChoreManagementPanel
        chores={mockChores}
        assignments={mockAssignments}
        onChoreCreate={onChoreCreate}
        onChoreEdit={onChoreEdit}
        onAssignmentOverride={onAssignmentOverride}
      />
    );

    fireEvent.press(getAllByText('Override')[0]);
    expect(onAssignmentOverride).toHaveBeenCalledWith(mockAssignments[0]);
  });
});
