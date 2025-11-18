import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VacationMode } from './VacationMode';

describe('VacationMode', () => {
  const onActivate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(<VacationMode onActivate={onActivate} />);
    expect(getByText('Vacation Mode')).toBeTruthy();
    expect(getByPlaceholderText('Start Date (YYYY-MM-DD)')).toBeTruthy();
    expect(getByPlaceholderText('End Date (YYYY-MM-DD)')).toBeTruthy();
  });

  it('should update input fields on change', () => {
    const { getByPlaceholderText } = render(<VacationMode onActivate={onActivate} />);

    const startDateInput = getByPlaceholderText('Start Date (YYYY-MM-DD)');
    fireEvent.changeText(startDateInput, '2025-01-01');
    expect(startDateInput.props.value).toBe('2025-01-01');

    const endDateInput = getByPlaceholderText('End Date (YYYY-MM-DD)');
    fireEvent.changeText(endDateInput, '2025-01-10');
    expect(endDateInput.props.value).toBe('2025-01-10');
  });

  it('should call onActivate with the correct dates when the button is pressed', () => {
    const { getByText, getByPlaceholderText } = render(<VacationMode onActivate={onActivate} />);

    fireEvent.changeText(getByPlaceholderText('Start Date (YYYY-MM-DD)'), '2025-01-01');
    fireEvent.changeText(getByPlaceholderText('End Date (YYYY-MM-DD)'), '2025-01-10');

    fireEvent.press(getByText('Activate Vacation Mode'));

    expect(onActivate).toHaveBeenCalledWith(new Date('2025-01-01'), new Date('2025-01-10'));
  });

  it('should not call onActivate if the date format is invalid', () => {
    const { getByText, getByPlaceholderText } = render(<VacationMode onActivate={onActivate} />);

    fireEvent.changeText(getByPlaceholderText('Start Date (YYYY-MM-DD)'), 'invalid-date');
    fireEvent.changeText(getByPlaceholderText('End Date (YYYY-MM-DD)'), '2025-01-10');

    fireEvent.press(getByText('Activate Vacation Mode'));

    expect(onActivate).not.toHaveBeenCalled();
  });
});
