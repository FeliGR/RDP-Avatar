import { useCallback, useRef, useMemo } from "react";
import {
  getAnimationsByCategory,
  getAnimationNameFromPath,
} from "../../../shared/config/glbAssets";

export const useAIResponseAnimations = (
  animationService,
  startSpecificIdleAnimation,
  playMessageResponseAnimation,
) => {
  const isProcessingRef = useRef(false);

  const defaultAnimations = useMemo(() => getAnimationsByCategory("all"), []);

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

        const availableAnimations = getAnimationsByCategory(category);

        if (availableAnimations.length === 0) {
          return;
        }

        const randomIndex = Math.floor(Math.random() * availableAnimations.length);
        const selectedAnimationPath = availableAnimations[randomIndex];

        const animationName = getAnimationNameFromPath(selectedAnimationPath);

        console.log(`[AI Response Animation] Playing ${animationName} for category: ${category}`);

        const result = playMessageResponseAnimation
          ? await playMessageResponseAnimation({
              category,
              animationName,
              isLooping: false,
              speedRatio: 1.0,
              transitionSpeed: 0.015,
              maxWeight: 0.8,
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
              const character = animationService?.getCurrentCharacter();

              if (character && character.currentAnimation) {
                const currentAnimName = character.currentAnimation.name;
                if (currentAnimName && currentAnimName.includes("_Idle_")) {
                  console.log(
                    `[AI Response Animation] Idle animation already playing (${currentAnimName}), not interfering`,
                  );
                  return;
                }
              }

              const playIdleUseCase =
                animationService.compositionRoot?.getPlayIdleAnimationUseCase();

              if (playIdleUseCase && playIdleUseCase.isIdleSystemActive(character)) {
                console.log("[AI Response Animation] Idle cycling system already active, resuming");

                const resumeResult = await playIdleUseCase.resume(character);

                if (resumeResult.success) {
                  console.log("[AI Response Animation] Successfully resumed idle cycling");
                } else {
                  console.warn(
                    "[AI Response Animation] Failed to resume idle cycling:",
                    resumeResult.error,
                  );
                }

                return;
              }

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
    [
      animationService,
      isCharacterReady,
      defaultAnimations,
      startSpecificIdleAnimation,
      playMessageResponseAnimation,
    ],
  );

  return {
    triggerAIResponseAnimation,
  };
};
