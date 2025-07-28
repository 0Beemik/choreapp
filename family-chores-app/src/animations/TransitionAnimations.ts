// src/animations/TransitionAnimations.ts
import { withTiming, Easing } from 'react-native-reanimated';

/**
 * Manages animations for screen and element transitions,
 * such as fading in new content or sliding between views.
 */
export class TransitionAnimationController {
  /**
   * Fades in an element.
   * @param opacity - The shared value for the element's opacity.
   * @param duration - The duration of the animation.
   */
  public fadeIn(opacity: { value: number }, duration: number = 300) {
    opacity.value = withTiming(1, { duration, easing: Easing.inOut(Easing.ease) });
  }

  /**
   * Fades out an element.
   * @param opacity - The shared value for the element's opacity.
   * @param duration - The duration of the animation.
   */
  public fadeOut(opacity: { value: number }, duration: number = 300) {
    opacity.value = withTiming(0, { duration, easing: Easing.inOut(Easing.ease) });
  }
}