// src/animations/TransitionAnimations.test.ts
import { TransitionAnimationController } from './TransitionAnimations';
import { withTiming, Easing } from 'react-native-reanimated';

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  withTiming: jest.fn(),
  Easing: {
    inOut: jest.fn(() => 'mocked-easing'),
    ease: 'mocked-ease',
  },
}));

describe('TransitionAnimationController', () => {
  let controller: TransitionAnimationController;

  beforeEach(() => {
    controller = new TransitionAnimationController();
    (withTiming as jest.Mock).mockClear();
    (Easing.inOut as jest.Mock).mockClear();
  });

  it('should call withTiming with the correct parameters for fadeIn', () => {
    const opacity = { value: 0 };
    const duration = 500;

    controller.fadeIn(opacity, duration);

    expect(Easing.inOut).toHaveBeenCalledWith('mocked-ease');
    expect(withTiming).toHaveBeenCalledWith(1, {
      duration,
      easing: 'mocked-easing',
    });
  });

  it('should call withTiming with the correct parameters for fadeOut', () => {
    const opacity = { value: 1 };
    const duration = 500;

    controller.fadeOut(opacity, duration);

    expect(Easing.inOut).toHaveBeenCalledWith('mocked-ease');
    expect(withTiming).toHaveBeenCalledWith(0, {
      duration,
      easing: 'mocked-easing',
    });
  });
});