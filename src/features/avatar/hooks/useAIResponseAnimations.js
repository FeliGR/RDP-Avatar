import { useCallback, useRef, useMemo } from 'react';

const ANIMATION_CATEGORIES = {
  expression: ['expression'],
  talking: ['expression'],
  dance: ['dance'],
  all: ['expression', 'dance']
};

export const useAIResponseAnimations = (animationService) => {
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

      // Play the animation
      const result = await animationService.playAnimation(animationName);
      
      if (result.success) {
        // Auto-revert to idle after animation duration
        setTimeout(async () => {
          try {
            await animationService.startIdleAnimations();
          } catch (error) {
            console.error('Failed to revert to idle:', error);
          }
        }, 3000); // 3 seconds default duration
      }
    } catch (error) {
      console.error('Error playing animation:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [animationService, isCharacterReady, defaultAnimations]);

  return {
    triggerAIResponseAnimation,
  };
};
