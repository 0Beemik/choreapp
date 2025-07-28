
// src/components/chores/ProgressIndicator/ProgressIndicator.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressIndicator } from './ProgressIndicator';

describe('ProgressIndicator', () => {
  it('should render the correct progress text', () => {
    const { getByText } = render(<ProgressIndicator total={10} completed={5} />);
    expect(getByText('5 / 10 chores completed')).toBeTruthy();
  });

  it('should calculate the progress percentage correctly', () => {
    const { getByTestId } = render(
      <ProgressIndicator total={10} completed={5} />,
    );
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.progress).toBe(50);
  });

  it('should handle the case where total is 0 to avoid division by zero', () => {
    const { getByTestId } = render(
      <ProgressIndicator total={0} completed={0} />,
    );
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.progress).toBe(0);
  });
});
