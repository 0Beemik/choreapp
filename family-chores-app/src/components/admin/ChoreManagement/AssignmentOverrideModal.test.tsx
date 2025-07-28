import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AssignmentOverrideModal } from './AssignmentOverrideModal';
import { ChoreAssignment } from '../../../models';

const mockAssignment: ChoreAssignment = {
  id: 'as-1',
  choreId: 'chore-1',
  userId: 'user-1',
  isComplete: false,
  dueDate: new Date(),
};

describe('AssignmentOverrideModal', () => {
  const onSave = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not be visible when visible prop is false', () => {
    const { queryByText } = render(
      <AssignmentOverrideModal
        assignment={mockAssignment}
        visible={false}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(queryByText('Override Assignment')).toBeNull();
  });

  it('should be visible when visible prop is true', () => {
    const { getByText } = render(
      <AssignmentOverrideModal
        assignment={mockAssignment}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(getByText('Override Assignment')).toBeTruthy();
  });

  it('should update input fields on change', () => {
    const { getByPlaceholderText } = render(
      <AssignmentOverrideModal
        assignment={mockAssignment}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const newUserInput = getByPlaceholderText('New User ID');
    fireEvent.changeText(newUserInput, 'user-2');
    expect(newUserInput.props.value).toBe('user-2');

    const reasonInput = getByPlaceholderText('Reason for override');
    fireEvent.changeText(reasonInput, 'Test reason');
    expect(reasonInput.props.value).toBe('Test reason');
  });

  it('should call onSave with the correct data when save button is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <AssignmentOverrideModal
        assignment={mockAssignment}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    fireEvent.changeText(getByPlaceholderText('New User ID'), 'user-2');
    fireEvent.changeText(getByPlaceholderText('Reason for override'), 'Test reason');

    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith('as-1', 'user-2', 'Test reason');
  });

  it('should call onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <AssignmentOverrideModal
        assignment={mockAssignment}
        visible={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
