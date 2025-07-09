import { useCallback, useRef, useMemo } from "react";

const ANIMATION_CATEGORIES = {
  expression: ["expression"],
  talking: ["expression"],
  dance: ["dance"],
  all: ["expression", "dance"],
};

export const useAIResponseAnimations = (animationService, startSpecificIdleAnimation, playMessageResponseAnimation) => {
  const isProcessingRef = useRef(false);

  const defaultAnimations = useMemo(
    () => [
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
    ],
    [],
  );

  const isCharacterReady = useCallback(() => {
    if (!animationService || !animationService.isReady()) {
      return false;
    }

    const character = animationService.getCurrentCharacter();
    return character && character.isLoaded;
  }, [animationService]);

  const triggerAIResponseAnimation = useCallback(
    async (category = "all") => {
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

        const categoryFolders = ANIMATION_CATEGORIES[category] || ANIMATION_CATEGORIES.all;
        const availableAnimations = defaultAnimations.filter((animPath) =>
          categoryFolders.some((folder) => animPath.includes(`/${folder}/`)),
        );

        if (availableAnimations.length === 0) {
          return;
        }

        const randomIndex = Math.floor(Math.random() * availableAnimations.length);
        const selectedAnimationPath = availableAnimations[randomIndex];

        const animationName = selectedAnimationPath.split("/").pop().replace(".glb", "");

        console.log(`[AI Response Animation] Playing ${animationName} for category: ${category}`);

        // Use the new message response animation method for better blending
        const result = playMessageResponseAnimation 
          ? await playMessageResponseAnimation({ 
              category,
              animationName,
              isLooping: false,
              speedRatio: 1.0,
              transitionSpeed: 0.015,
              maxWeight: 0.8
            })
          : await animationService.playAnimationWithTransition(animationName, {
              isLooping: false,
              speedRatio: 1.0,
              transitionDuration: 0.3,
            });

        if (result.success) {
          console.log(`[AI Response Animation] Successfully played ${animationName}`);
          const character = animationService.getCurrentCharacter();
          const animationGroup = character?.getAnimationGroup(animationName);

          let animationDuration = 3000;

          if (animationGroup && animationGroup.to && animationGroup.from) {
            const frameCount = animationGroup.to - animationGroup.from;
            animationDuration = (frameCount / 60) * 1000;
          } else if (animationGroup && animationGroup.duration) {
            animationDuration = animationGroup.duration * 1000;
          }

          const timeoutDuration = Math.max(1500, Math.min(animationDuration - 200, 6000));

          setTimeout(async () => {
            try {
              // Check if we should return to idle or let the main idle system handle it
              const character = animationService?.getCurrentCharacter();
              
              if (character && character.currentAnimation) {
                // If there's already an idle animation playing, don't interfere
                const currentAnimName = character.currentAnimation.name;
                if (currentAnimName && currentAnimName.includes('_Idle_')) {
                  console.log(`[AI Response Animation] Idle animation already playing (${currentAnimName}), not interfering`);
                  return;
                }
              }
              
              // Only start idle if no idle system is active
              if (startSpecificIdleAnimation) {
                await startSpecificIdleAnimation();
              } else {
                await animationService.startIdleAnimations();
              }
            } catch (error) {
              console.error("Failed to revert to idle:", error);
            }
          }, timeoutDuration);
        } else {
          console.error(`[AI Response Animation] Failed to play ${animationName}:`, result.error);
        }
      } catch (error) {
        console.error("[AI Response Animation] Error playing animation:", error);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [animationService, isCharacterReady, defaultAnimations, startSpecificIdleAnimation, playMessageResponseAnimation],
  );

  return {
    triggerAIResponseAnimation,
  };
};
