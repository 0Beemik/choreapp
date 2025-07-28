import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddChoreModal } from './AddChoreModal';

describe('AddChoreModal', () => {
  const onSave = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not be visible when visible prop is false', () => {
    const { queryByText } = render(
      <AddChoreModal visible={false} onSave={onSave} onClose={onClose} />
    );
    expect(queryByText('Add New Chore')).toBeNull();
  });

  it('should be visible when visible prop is true', () => {
    const { getByText } = render(
      <AddChoreModal visible={true} onSave={onSave} onClose={onClose} />
    );
    expect(getByText('Add New Chore')).toBeTruthy();
  });

  it('should update input fields on change', () => {
    const { getByPlaceholderText } = render(
      <AddChoreModal visible={true} onSave={onSave} onClose={onClose} />
    );

    const nameInput = getByPlaceholderText('Name');
    fireEvent.changeText(nameInput, 'New Chore');
    expect(nameInput.props.value).toBe('New Chore');

    const descriptionInput = getByPlaceholderText('Description');
    fireEvent.changeText(descriptionInput, 'New Description');
    expect(descriptionInput.props.value).toBe('New Description');

    const minutesInput = getByPlaceholderText('Estimated Minutes');
    fireEvent.changeText(minutesInput, '30');
    expect(minutesInput.props.value).toBe('30');
  });

  it('should call onSave with the correct data when save button is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddChoreModal visible={true} onSave={onSave} onClose={onClose} />
    );

    fireEvent.changeText(getByPlaceholderText('Name'), 'New Chore');
    fireEvent.changeText(getByPlaceholderText('Description'), 'New Description');
    fireEvent.changeText(getByPlaceholderText('Estimated Minutes'), '30');

    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      name: 'New Chore',
      description: 'New Description',
      estimatedMinutes: 30,
      category: 'general',
    });
  });

  it('should call onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <AddChoreModal visible={true} onSave={onSave} onClose={onClose} />
    );

    fireEvent.press(getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
