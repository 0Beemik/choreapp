import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EditChoreModal } from './EditChoreModal';
import { Chore } from '../../../models';

const mockChore: Chore = {
  id: 'chore-1',
  name: 'Test Chore',
  description: 'Test Description',
  estimatedMinutes: 30,
  points: 10,
  isBlocking: false,
  isComplete: false,
};

describe('EditChoreModal', () => {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not be visible when visible prop is false', () => {
    const { queryByText } = render(
      <EditChoreModal
        chore={mockChore}
        visible={false}
        onSave={onSave}
        onClose={onClose}
        onDelete={onDelete}
      />
    );
    expect(queryByText('Edit Chore')).toBeNull();
  });

  it('should be visible when visible prop is true', () => {
    const { getByText } = render(
      <EditChoreModal
        chore={mockChore}
        visible={true}
        onSave={onSave}
        onClose={onClose}
        onDelete={onDelete}
      />
    );
    expect(getByText('Edit Chore')).toBeTruthy();
  });

  it('should pre-fill the input fields with chore data', () => {
    const { getByPlaceholderText } = render(
      <EditChoreModal
        chore={mockChore}
        visible={true}
        onSave={onSave}
        onClose={onClose}
        onDelete={onDelete}
      />
    );

    expect(getByPlaceholderText('Name').props.value).toBe('Test Chore');
    expect(getByPlaceholderText('Description').props.value).toBe('Test Description');
    expect(getByPlaceholderText('Estimated Minutes').props.value).toBe('30');
  });

  it('should update input fields on change', () => {
    const { getByPlaceholderText } = render(
      <EditChoreModal
        chore={mockChore}
        visible={true}
        onSave={onSave}
        onClose={onClose}
        onDelete={onDelete}
      />
    );

    const nameInput = getByPlaceholderText('Name');
    fireEvent.changeText(nameInput, 'Updated Chore');
    expect(nameInput.props.value).toBe('Updated Chore');
  });

  it('should call onSave with the correct data when save button is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <EditChoreModal
        chore={mockChore}
        visible={true}
        onSave={onSave}
        onClose={onClose}
        onDelete={onDelete}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Name'), 'Updated Chore');
    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith('chore-1', {
      name: 'Updated Chore',
      description: 'Test Description',
      estimatedMinutes: 30,
    });
  });

  it('should call onDelete with the correct chore ID when delete button is pressed', () => {
    const { getByText } = render(
      <EditChoreModal
        chore={mockChore}
        visible={true}
        onSave={onSave}
        onClose={onClose}
        onDelete={onDelete}
      />
    );

    fireEvent.press(getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('chore-1');
  });

  it('should call onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <EditChoreModal
        chore={mockChore}
        visible={true}
        onSave={onSave}
        onClose={onClose}
        onDelete={onDelete}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
