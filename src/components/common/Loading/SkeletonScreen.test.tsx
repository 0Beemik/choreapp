import React from 'react';
import { render } from '@testing-library/react-native';
import { SkeletonScreen } from './SkeletonScreen';

describe('SkeletonScreen', () => {
  it('renders the correct number of skeleton pieces', () => {
    const { getAllByTestId } = render(<SkeletonScreen />);
    expect(getAllByTestId('skeleton-piece')).toHaveLength(3);
  });
});
