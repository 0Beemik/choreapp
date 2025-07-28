import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PinEntry } from './PinEntry';

describe('PinEntry', () => {
  const mockOnPinSubmit = jest.fn();

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<PinEntry onPinSubmit={mockOnPinSubmit} />);
    expect(getByText('Enter Admin PIN')).toBeDefined();
    expect(getByPlaceholderText('****')).toBeDefined();
  });

  it('updates pin value on change', () => {
    const { getByPlaceholderText } = render(<PinEntry onPinSubmit={mockOnPinSubmit} />);
    const input = getByPlaceholderText('****');
    fireEvent.changeText(input, '1234');
    expect(input.props.value).toBe('1234');
  });

  it('calls onPinSubmit with the entered pin', () => {
    const { getByText, getByPlaceholderText } = render(<PinEntry onPinSubmit={mockOnPinSubmit} />);
    const input = getByPlaceholderText('****');
    fireEvent.changeText(input, '1234');
    const submitButton = getByText('Submit');
    fireEvent.press(submitButton);
    expect(mockOnPinSubmit).toHaveBeenCalledWith('1234');
  });

  it('displays an error message', () => {
    const errorMessage = 'Invalid PIN';
    const { getByText } = render(<PinEntry onPinSubmit={mockOnPinSubmit} error={errorMessage} />);
    expect(getByText(errorMessage)).toBeDefined();
  });
});
