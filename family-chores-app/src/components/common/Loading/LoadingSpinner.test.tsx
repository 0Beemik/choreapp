import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<LoadingSpinner />);
    expect(getByTestId('activity-indicator')).toBeDefined();
  });

  it('renders with the correct size', () => {
    const { getByTestId } = render(<LoadingSpinner size="small" />);
    const activityIndicator = getByTestId('activity-indicator');
    expect(activityIndicator.props.size).toBe('small');
  });

  it('renders with the correct color', () => {
    const { getByTestId } = render(<LoadingSpinner color="#ff0000" />);
    const activityIndicator = getByTestId('activity-indicator');
    expect(activityIndicator.props.color).toBe('#ff0000');
  });
});
