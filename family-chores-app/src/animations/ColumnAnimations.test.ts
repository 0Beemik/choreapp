// src/animations/ColumnAnimations.test.ts
import { ColumnAnimationController } from './ColumnAnimations';
import { withTiming, Easing } from 'react-native-reanimated';

// Mock the react-native-reanimated functions
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  withTiming: jest.fn(),
  Easing: {
    bezier: jest.fn(),
    ease: jest.fn(),
  },
}));

describe('ColumnAnimationController', () => {
  let controller: ColumnAnimationController;

  beforeEach(() => {
    controller = new ColumnAnimationController();
    (withTiming as jest.Mock).mockClear();
    (Easing.bezier as jest.Mock).mockClear();
    (Easing.ease as jest.Mock).mockClear();
  });

  it('should expand the column', () => {
    const isExpanded = { value: 0 };
    controller.expand(isExpanded);
    expect(withTiming).toHaveBeenCalledWith(1, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  });

  it('should collapse the column', () => {
    const isExpanded = { value: 1 };
    controller.collapse(isExpanded);
    expect(withTiming).toHaveBeenCalledWith(0, {
      duration: 400,
      easing: Easing.ease,
    });
  });

  it('should blur the background', () => {
    const isVisible = { value: 0 };
    controller.blurBackground(isVisible);
    expect(withTiming).toHaveBeenCalledWith(1, {
      duration: 300,
    });
  });

  it('should remove the background blur', () => {
    const isVisible = { value: 1 };
    controller.removeBlur(isVisible);
    expect(withTiming).toHaveBeenCalledWith(0, {
      duration: 200,
    });
  });
});