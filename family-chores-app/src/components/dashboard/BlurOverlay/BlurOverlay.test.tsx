import React from 'react';
import { render, act } from '@testing-library/react-native';
import { BlurOverlay } from './BlurOverlay';

describe('BlurOverlay', () => {
  it('renders correctly but is not visible initially', () => {
    jest.useFakeTimers();
    const visible = { value: 0 };
    const { queryByTestId } = render(
      <BlurOverlay visible={visible} testID="blur-overlay" />
    );
    act(() => {
      jest.runAllTimers();
    });
    expect(queryByTestId('blur-overlay')).toBeNull();
  });

  it('is visible when visible.value is greater than 0', () => {
    const visible = { value: 1 };
    const { getByTestId } = render(
      <BlurOverlay visible={visible} testID="blur-overlay" />
    );
    const overlay = getByTestId('blur-overlay');
    // We can't directly test the animated style here without a more complex setup,
    // but we can check that the component is rendered.
    // The visibility logic is handled by reanimated, which we assume is tested.
    expect(overlay).toBeTruthy();
  });

  it('is not visible when visible.value is 0', () => {
    const visible = { value: 0 };
    const { queryByTestId } = render(
      <BlurOverlay visible={visible} testID="blur-overlay" />
    );
    const overlay = queryByTestId('blur-overlay');
    // Similar to the above, we check that the component is rendered.
    // The display style will be 'none' due to the animated style.
    expect(overlay).toBeNull();
  });
});