// src/animations/CelebrationAnimations.test.ts
import { CelebrationAnimationController } from './CelebrationAnimations';
import { withSequence, withTiming, withSpring } from 'react-native-reanimated';

// Mock the react-native-reanimated functions
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  withSequence: jest.fn(),
  withTiming: jest.fn(),
  withSpring: jest.fn(),
}));

describe('CelebrationAnimationController', () => {
  let controller: CelebrationAnimationController;

  beforeEach(() => {
    controller = new CelebrationAnimationController();
    (withSequence as jest.Mock).mockClear();
    (withTiming as jest.Mock).mockClear();
    (withSpring as jest.Mock).mockClear();
  });

  it('should trigger a badge unlock animation', () => {
    const scale = { value: 0 };
    const opacity = { value: 0 };

    controller.playBadgeUnlock(scale, opacity);

    expect(withSequence).toHaveBeenCalledTimes(1);
    expect(withTiming).toHaveBeenCalledTimes(3);
    expect(withSpring).toHaveBeenCalledTimes(1);

    expect(withTiming).toHaveBeenCalledWith(1, { duration: 200 });
  });

  it('should trigger a point award animation', () => {
    const animatedValue = { value: 0 };

    controller.playPointAward(animatedValue);

    expect(withSequence).toHaveBeenCalledTimes(1);
    expect(withTiming).toHaveBeenCalledTimes(2);
  });
});