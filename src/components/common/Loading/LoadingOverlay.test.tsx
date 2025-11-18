import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingOverlay } from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('is not visible when the visible prop is false', () => {
    const { queryByTestId } = render(<LoadingOverlay visible={false} />);
    expect(queryByTestId('loading-overlay')).toBeNull();
  });

  it('is visible when the visible prop is true', () => {
    const { getByTestId } = render(<LoadingOverlay visible={true} />);
    expect(getByTestId('loading-overlay')).toBeDefined();
  });

  it('shows an activity indicator when visible', () => {
    const { getByTestId } = render(<LoadingOverlay visible={true} />);
    expect(getByTestId('activity-indicator')).toBeDefined();
  });
});
