import { animationController } from './AnimationController';
import { CelebrationAnimationController } from './CelebrationAnimations';

describe('AnimationController', () => {
  it('should have a celebrations controller', () => {
    expect(animationController.celebrations).toBeInstanceOf(CelebrationAnimationController);
  });
});
