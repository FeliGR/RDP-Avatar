import React from "react";
import { useTranslation } from "react-i18next";
import { usePersonality } from "./context/PersonalityContext";
import "./PersonalityControls.css";
import { ErrorMessage } from "../../shared";
import TraitSlider from "./components/TraitSlider";
import { BIG_FIVE_TRAITS } from "./constants/constants";
import useDebounce from "./hooks/useDebounce";
import useLocalTraits from "./hooks/useLocalTraits";

const PersonalityControls = () => {
  const { t } = useTranslation();
  const { personalityTraits, updateTrait, isLoading, error } = usePersonality();
  const [localTraits, updateLocalTrait] = useLocalTraits(personalityTraits);
  const debouncedUpdateTrait = useDebounce((trait, value) => {
    updateTrait(trait, value);
  }, 400);
  const handleTraitChange = (trait, value) => {
    const numericValue = parseInt(value, 10);
    updateLocalTrait(trait, numericValue);
    debouncedUpdateTrait(trait, numericValue);
  };
  return (
    <div className="personality-controls">
      <ErrorMessage message={error} />
      {isLoading && <div className="loading-indicator" aria-label={t("common.loading")} />}
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
