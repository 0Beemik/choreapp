// src/animations/AnimationController.ts
import { ColumnAnimationController } from './ColumnAnimations';
import { CelebrationAnimationController } from './CelebrationAnimations';

/**
 * A master controller to manage all animation controllers in the app.
 * This provides a single point of access for triggering complex animations.
 */
class AnimationController {
  public readonly columns: ColumnAnimationController;
  public readonly celebrations: CelebrationAnimationController;

  constructor() {
    this.columns = new ColumnAnimationController();
    this.celebrations = new CelebrationAnimationController();
    // Initialize other controllers here as they are built
  }
}

export const animationController = new AnimationController();