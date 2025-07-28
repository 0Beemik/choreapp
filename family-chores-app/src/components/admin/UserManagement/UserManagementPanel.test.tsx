import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UserManagementPanel } from './UserManagementPanel';
import { User, Family } from '../../../models';

const mockFamily: Family = {
  id: 'family-1',
  name: 'Test Family',
  members: [
    { id: 'user-1', name: 'Test User 1', role: 'parent' },
    { id: 'user-2', name: 'Test User 2', role: 'child' },
  ],
  settings: {
    pointsPerChore: 10,
    buyoutCostPercentage: 50,
    maxBuyoutsPerMonth: 2,
  },
};

describe('UserManagementPanel', () => {
  const onUserAdd = jest.fn();
  const onUserEdit = jest.fn();
  const onUserRemove = jest.fn();
  const onAdjustPoints = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the list of users', () => {
    const { getByText } = render(
      <UserManagementPanel
        family={mockFamily}
        onUserAdd={onUserAdd}
        onUserEdit={onUserEdit}
        onUserRemove={onUserRemove}
        onAdjustPoints={onAdjustPoints}
      />
    );

    expect(getByText('Test User 1')).toBeTruthy();
    expect(getByText('Test User 2')).toBeTruthy();
  });

  it('should call onUserAdd when the "Add User" button is pressed', () => {
    const { getByText } = render(
      <UserManagementPanel
        family={mockFamily}
        onUserAdd={onUserAdd}
        onUserEdit={onUserEdit}
        onUserRemove={onUserRemove}
        onAdjustPoints={onAdjustPoints}
      />
    );

    fireEvent.press(getByText('Add User'));
    expect(onUserAdd).toHaveBeenCalled();
  });

  it('should call onUserEdit with the correct user when the "Edit" button is pressed', () => {
    const { getAllByText } = render(
      <UserManagementPanel
        family={mockFamily}
        onUserAdd={onUserAdd}
        onUserEdit={onUserEdit}
        onUserRemove={onUserRemove}
        onAdjustPoints={onAdjustPoints}
      />
    );

    fireEvent.press(getAllByText('Edit')[0]);
    expect(onUserEdit).toHaveBeenCalledWith(mockFamily.members[0]);
  });

  it('should call onUserRemove with the correct user ID when the "Remove" button is pressed', () => {
    const { getAllByText } = render(
      <UserManagementPanel
        family={mockFamily}
        onUserAdd={onUserAdd}
        onUserEdit={onUserEdit}
        onUserRemove={onUserRemove}
        onAdjustPoints={onAdjustPoints}
      />
    );

    fireEvent.press(getAllByText('Remove')[0]);
    expect(onUserRemove).toHaveBeenCalledWith(mockFamily.members[0].id);
  });

  it('should call onAdjustPoints with the correct user when the "Adjust Points" button is pressed', () => {
    const { getAllByText } = render(
      <UserManagementPanel
        family={mockFamily}
        onUserAdd={onUserAdd}
        onUserEdit={onUserEdit}
        onUserRemove={onUserRemove}
        onAdjustPoints={onAdjustPoints}
      />
    );

    fireEvent.press(getAllByText('Adjust Points')[0]);
    expect(onAdjustPoints).toHaveBeenCalledWith(mockFamily.members[0]);
  });
});
