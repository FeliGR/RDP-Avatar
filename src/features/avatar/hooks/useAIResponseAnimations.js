import { useCallback, useRef, useMemo } from 'react';

const ANIMATION_CATEGORIES = {
  expression: ['expression'],
  talking: ['expression'],
  dance: ['dance'],
  all: ['expression', 'dance']
};

export const useAIResponseAnimations = (animationService, startSpecificIdleAnimation) => {
  const isProcessingRef = useRef(false);

  // Default animations that should be loaded
  const defaultAnimations = useMemo(() => [
    "/animations/masculine/expression/M_Standing_Expressions_001.glb",
    "/animations/masculine/expression/M_Standing_Expressions_002.glb",
    "/animations/masculine/expression/M_Standing_Expressions_004.glb",
    "/animations/masculine/expression/M_Standing_Expressions_005.glb",
    "/animations/masculine/expression/M_Standing_Expressions_006.glb",
    "/animations/masculine/expression/M_Standing_Expressions_007.glb",
    "/animations/masculine/expression/M_Standing_Expressions_008.glb",
    "/animations/masculine/expression/M_Standing_Expressions_009.glb",
    "/animations/masculine/expression/M_Standing_Expressions_010.glb",
    "/animations/masculine/dance/M_Dances_001.glb",
    "/animations/masculine/dance/M_Dances_002.glb",
    "/animations/masculine/dance/M_Dances_003.glb",
    "/animations/masculine/dance/M_Dances_004.glb",
    "/animations/masculine/dance/M_Dances_005.glb",
    "/animations/masculine/dance/M_Dances_006.glb",
  ], []);

  const isCharacterReady = useCallback(() => {
    if (!animationService || !animationService.isReady()) {
      return false;
    }

    const character = animationService.getCurrentCharacter();
    return character && character.isLoaded;
  }, [animationService]);

  const triggerAIResponseAnimation = useCallback(async (category = 'all') => {
    if (isProcessingRef.current) {
      return;
    }

    if (!animationService || !animationService.isReady()) {
      return;
    }

    if (!isCharacterReady()) {
      return;
    }

    try {
      isProcessingRef.current = true;

      // Get animations for the specified category
      const categoryFolders = ANIMATION_CATEGORIES[category] || ANIMATION_CATEGORIES.all;
      const availableAnimations = defaultAnimations.filter(animPath => 
        categoryFolders.some(folder => animPath.includes(`/${folder}/`))
      );

      if (availableAnimations.length === 0) {
        return;
      }

      // Select random animation
      const randomIndex = Math.floor(Math.random() * availableAnimations.length);
      const selectedAnimationPath = availableAnimations[randomIndex];
      
      // Extract animation name from file path (remove path and extension)
      const animationName = selectedAnimationPath
        .split('/')
        .pop()
        .replace('.glb', '');

      // Play the animation with smooth transition
      const result = await animationService.playAnimationWithTransition(animationName, {
        isLooping: false,
        speedRatio: 1.0,
        transitionDuration: 0.3 // 300ms smooth transition
      });
      
      if (result.success) {
        // Get the character to check animation duration
        const character = animationService.getCurrentCharacter();
        const animationGroup = character?.getAnimationGroup(animationName);
        
        // Calculate animation duration properly
        // In Babylon.js, animation duration is typically in frames at 60 FPS
        let animationDuration = 3000; // Default fallback
        
        if (animationGroup && animationGroup.to && animationGroup.from) {
          const frameCount = animationGroup.to - animationGroup.from;
          animationDuration = (frameCount / 60) * 1000; // Convert to milliseconds assuming 60 FPS
        } else if (animationGroup && animationGroup.duration) {
          // Some animations might have duration property
          animationDuration = animationGroup.duration * 1000;
        }
        
        // Ensure reasonable bounds and add buffer
        const timeoutDuration = Math.max(2000, Math.min(animationDuration + 1000, 8000));
        
        // Auto-revert to specific idle animation after animation completes
        setTimeout(async () => {
          try {
            if (startSpecificIdleAnimation) {
              await startSpecificIdleAnimation();
            } else {
              await animationService.startIdleAnimations();
            }
          } catch (error) {
            console.error('Failed to revert to idle:', error);
          }
        }, timeoutDuration);
      }
    } catch (error) {
      console.error('Error playing animation:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [animationService, isCharacterReady, defaultAnimations, startSpecificIdleAnimation]);

  return {
    triggerAIResponseAnimation,
  };
};
