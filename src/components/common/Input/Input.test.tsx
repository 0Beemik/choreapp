import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from './Input';

describe('Input', () => {
  it('renders the label', () => {
    const { getByText } = render(
      <Input label="Test Label" value="" onChangeText={() => {}} />
    );
    expect(getByText('Test Label')).toBeTruthy();
  });

  it('calls onChangeText when text is changed', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <Input
        placeholder="Test Placeholder"
        value=""
        onChangeText={onChangeTextMock}
      />
    );
    fireEvent.changeText(getByPlaceholderText('Test Placeholder'), 'new text');
    expect(onChangeTextMock).toHaveBeenCalledWith('new text');
  });

  it('displays an error message', () => {
    const { getByText } = render(
      <Input value="" onChangeText={() => {}} error="Test Error" />
    );
    expect(getByText('Test Error')).toBeTruthy();
  });
});
