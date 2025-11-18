// src/animations/CelebrationAnimations.ts
import { withSequence, withTiming, withSpring } from 'react-native-reanimated';

/**
 * Manages complex celebration animations for events like earning a badge,
 * completing a chore, or leveling up.
 */
export class CelebrationAnimationController {
  /**
   * Triggers a celebratory animation for a badge unlock.
   * @param scale - The shared value for the badge's scale.
   * @param opacity - The shared value for the badge's opacity.
   */
  public playBadgeUnlock(scale: { value: number }, opacity: { value: number }) {
    scale.value = withSequence(
      withTiming(0.5, { duration: 100 }),
      withSpring(1.2, { damping: 2, stiffness: 80 }),
      withTiming(1, { duration: 200 })
    );
    opacity.value = withTiming(1, { duration: 200 });
  }

  /**
   * Triggers a point award animation.
   * @param animatedValue - A shared value to animate, e.g., for position or opacity.
   */
  public playPointAward(animatedValue: { value: number }) {
    animatedValue.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 500 })
    );
  }
}