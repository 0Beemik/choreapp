// src/animations/LoadingAnimations.test.ts
import { LoadingAnimationController } from './LoadingAnimations';
import { withRepeat, withTiming, Easing } from 'react-native-reanimated';

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  withRepeat: jest.fn(),
  withTiming: jest.fn(),
  Easing: {
    inOut: jest.fn(),
    ease: jest.fn(),
  },
}));

describe('LoadingAnimationController', () => {
  let controller: LoadingAnimationController;

  beforeEach(() => {
    controller = new LoadingAnimationController();
    (withRepeat as jest.Mock).mockClear();
    (withTiming as jest.Mock).mockClear();
  });

  it('should start the shimmer animation', () => {
    const shimmerValue = { value: 0 };
    controller.startShimmer(shimmerValue);
    expect(withRepeat).toHaveBeenCalledWith(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  });
});