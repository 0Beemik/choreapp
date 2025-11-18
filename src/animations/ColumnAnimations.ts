// src/animations/ColumnAnimations.ts
import { withTiming, Easing } from 'react-native-reanimated';

export interface ColumnAnimationConfig {
  duration?: number;
  easing?: (value: number) => number;
}

/**
 * Manages animations for the user columns in the dashboard,
 * such as expanding, collapsing, and background blur effects.
 */
export class ColumnAnimationController {
  /**
   * Returns the animated style for a column expansion.
   * @param isExpanded - A shared value representing the expansion state (0 or 1).
   * @param config - Optional animation configuration.
   */
  public expand(isExpanded: { value: number }, config: ColumnAnimationConfig = {}) {
    const { duration = 500, easing = Easing.bezier(0.25, 0.1, 0.25, 1) } = config;
    isExpanded.value = withTiming(1, { duration, easing });
  }

  /**
   * Returns the animated style for a column collapse.
   * @param isExpanded - A shared value representing the expansion state (0 or 1).
   * @param config - Optional animation configuration.
   */
  public collapse(isExpanded: { value: number }, config: ColumnAnimationConfig = {}) {
    const { duration = 400, easing = Easing.ease } = config;
    isExpanded.value = withTiming(0, { duration, easing });
  }

  /**
   * Returns the animated style for the background blur overlay.
   * @param isVisible - A shared value representing the blur state (0 or 1).
   */
  public blurBackground(isVisible: { value: number }) {
    isVisible.value = withTiming(1, { duration: 300 });
  }

  /**
   * Returns the animated style to remove the background blur.
   * @param isVisible - A shared value representing the blur state (0 or 1).
   */
  public removeBlur(isVisible: { value: number }) {
    isVisible.value = withTiming(0, { duration: 200 });
  }
}