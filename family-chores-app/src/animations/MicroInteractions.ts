// src/animations/MicroInteractions.ts
import { withSequence, withTiming } from 'react-native-reanimated';

/**
 * Manages small, delightful animations for user feedback on actions
 * like button presses or checkbox ticks.
 */
export class MicroInteractionController {
  /**
   * A "pop" effect for when a button is pressed.
   * @param scale - The shared value for the element's scale.
   */
  public playButtonPress(scale: { value: number }) {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  }

  /**
   * A "wobble" effect for incorrect input or errors.
   * @param rotation - The shared value for the element's rotation.
   */
  public playErrorWobble(rotation: { value: number }) {
    rotation.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }
}