// src/animations/MicroInteractions.test.ts
import { MicroInteractionController } from './MicroInteractions';
import { withSequence, withTiming } from 'react-native-reanimated';

// Mock the react-native-reanimated functions
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  withSequence: jest.fn(),
  withTiming: jest.fn(),
}));

describe('MicroInteractionController', () => {
  let controller: MicroInteractionController;

  beforeEach(() => {
    controller = new MicroInteractionController();
    (withSequence as jest.Mock).mockClear();
    (withTiming as jest.Mock).mockClear();
  });

  it('should play a button press animation', () => {
    const scale = { value: 1 };
    controller.playButtonPress(scale);
    expect(withSequence).toHaveBeenCalledTimes(1);
    expect(withTiming).toHaveBeenCalledTimes(2);
  });

  it('should play an error wobble animation', () => {
    const rotation = { value: 0 };
    controller.playErrorWobble(rotation);
    expect(withSequence).toHaveBeenCalledTimes(1);
    expect(withTiming).toHaveBeenCalledTimes(4);
  });
});