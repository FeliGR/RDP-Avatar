export class PlayIdleAnimationUseCase {
  constructor({ animationController, morphTargetController }) {
    this.animationController = animationController;
    this.morphTargetController = morphTargetController;
  }

  async execute(character) {
    if (!character.canPlayAnimation("idle")) {
      throw new Error("Character cannot play idle animations");
    }

    const idleAnimationNames = [
      "M_Standing_Idle_Variations_001",
      "M_Standing_Idle_Variations_002",
      "M_Standing_Idle_Variations_003",

      "Idle_Variations_001",
      "Idle_Variations_002",
      "Idle_Variations_003",
    ];

    let availableAnimations = [];

    idleAnimationNames.forEach((name) => {
      if (character.hasAnimation(name)) {
        availableAnimations.push(name);
      }
    });

    if (availableAnimations.length === 0) {
      throw new Error("No idle animations available");
    }

    const selectedAnimation = availableAnimations[0];

    try {
      console.log(`[Idle Animation] Starting idle animation: ${selectedAnimation}`);
      
      await this.animationController.playAnimationWithBlending(character, selectedAnimation, {
        isLooping: true,
        speedRatio: 1.0,
        transitionSpeed: 0.015, // Smoother initial transition
        maxWeight: 1.0
      });

      this.morphTargetController.startAutomaticFacialAnimations(character);

      // Set up idle variation cycling after the initial animation starts
      this._setupIdleVariationCycling(character, availableAnimations);

      return {
        success: true,
        message: `Started idle animation: ${selectedAnimation}`,
      };
    } catch (error) {
      console.error(`[Idle Animation] Error starting idle animation:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _setupIdleVariationCycling(character, availableAnimations) {
    if (availableAnimations.length <= 1) {
      console.log("[Idle Cycling] Only one animation available, no cycling needed");
      return;
    }

    let currentIndex = 0;
    let isTransitioning = false; // Flag to prevent multiple transitions

    const cycleToNextAnimation = () => {
      console.log("[Idle Cycling] Animation ended, cycling to next animation");
      
      // Prevent multiple simultaneous transitions
      if (isTransitioning) {
        console.log("[Idle Cycling] Transition already in progress, skipping");
        return;
      }
      
      if (availableAnimations.length > 1) {
        isTransitioning = true;
        
        // Pick a different animation from the current one to avoid repetition
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * availableAnimations.length);
        } while (nextIndex === currentIndex && availableAnimations.length > 1);
        
        currentIndex = nextIndex;
        const nextAnimation = availableAnimations[currentIndex];

        console.log(`[Idle Cycling] Switching to next idle animation: ${nextAnimation} (${currentIndex + 1}/${availableAnimations.length})`);
        
        // Use smooth blending for idle transitions
        this.animationController.playAnimationWithBlending(character, nextAnimation, {
          isLooping: true,
          speedRatio: 1.0,
          transitionSpeed: 0.015, // Slightly faster for idle transitions
          maxWeight: 1.0
        }).then(() => {
          console.log(`[Idle Cycling] Successfully started ${nextAnimation}, setting up next observer`);
          isTransitioning = false;
          
          // Add a small delay before setting up the next observer
          setTimeout(() => {
            this.animationController.setupIdleObservers(character, cycleToNextAnimation);
          }, 200);
        }).catch(error => {
          console.warn(`[Idle Cycling] Error transitioning to ${nextAnimation}:`, error);
          isTransitioning = false;
          
          // Try to set up observer anyway in case of error
          setTimeout(() => {
            this.animationController.setupIdleObservers(character, cycleToNextAnimation);
          }, 1000);
        });
      }
    };

    console.log(`[Idle Cycling] Setting up idle cycling with ${availableAnimations.length} animations`);
    
    // Add a small delay before setting up the initial observer
    setTimeout(() => {
      this.animationController.setupIdleObservers(character, cycleToNextAnimation);
    }, 300);
  }

  stop(character) {
    try {
      this.animationController.removeObservers(character);
      this.animationController.stopAnimation(character);
      this.morphTargetController.stopAutomaticFacialAnimations(character);

      return {
        success: true,
        message: "Idle animations stopped",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
