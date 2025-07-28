import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompletionCheckbox } from './CompletionCheckbox';

describe('CompletionCheckbox', () => {
  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(
      <CompletionCheckbox checked={false} onPress={onPressMock} />
    );
    fireEvent.press(getByRole('checkbox'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('is accessible', () => {
    const { getByRole } = render(
      <CompletionCheckbox checked={true} onPress={() => {}} />
    );
    const checkbox = getByRole('checkbox');
    expect(checkbox.props.accessibilityState.checked).toBe(true);
  });
});
