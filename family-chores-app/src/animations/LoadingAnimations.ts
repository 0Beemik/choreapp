// src/animations/LoadingAnimations.ts
import { withRepeat, withTiming, Easing } from 'react-native-reanimated';

/**
 * Manages animations for loading states, such as skeleton loaders.
 */
export class LoadingAnimationController {
  /**
   * Creates a shimmering effect for skeleton loaders.
   * @param shimmerValue - A shared value, typically for opacity or translation.
   */
  public startShimmer(shimmerValue: { value: number }) {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }
}