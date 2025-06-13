import React from "react";
import { usePersonality } from "./context/PersonalityContext";
import "./PersonalityControls.css";
import ErrorMessage from "./components/ErrorMessage";
import TraitSlider from "./components/TraitSlider";
import { BIG_FIVE_TRAITS } from "./constants/constants";
import useDebounce from "./hooks/useDebounce";
import useLocalTraits from "./hooks/useLocalTraits";

/**
 * Component for controlling personality traits
 */
const PersonalityControls = () => {
  const { personalityTraits, updateTrait, isLoading, error } = usePersonality();
  const [localTraits, updateLocalTrait] = useLocalTraits(personalityTraits);

  const debouncedUpdateTrait = useDebounce((trait, value) => {
    updateTrait(trait, value);
  }, 400);

  /**
   * Handler for trait slider changes
   */
  const handleTraitChange = (trait, value) => {
    const numericValue = parseInt(value, 10);

    updateLocalTrait(trait, numericValue);

    debouncedUpdateTrait(trait, numericValue);
  };

  return (
    <div className="personality-controls">
      <ErrorMessage message={error} />

      {isLoading && <div className="loading-indicator" aria-label="Loading..." />}

      {BIG_FIVE_TRAITS.map((trait) => (
        <TraitSlider
          key={trait}
          trait={trait}
          value={localTraits[trait] || 3}
          onChange={handleTraitChange}
          disabled={isLoading}
        />
      ))}
    </div>
  );
};

export default PersonalityControls;
