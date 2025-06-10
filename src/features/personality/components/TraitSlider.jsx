import React, { useEffect, useRef, useState } from "react";
import { DETAILED_TRAIT_DESCRIPTIONS, TRAIT_DESCRIPTIONS } from "../constants/constants";
import { formatTrait } from "../../../shared/utils";
import TraitInfoModal from "./TraitInfoModal";
import "./TraitInfoModal.css";

/**
 * TraitSlider component for individual personality trait control
 */
const TraitSlider = ({ trait, value, onChange, disabled = false }) => {
  const rangeRef = useRef(null);
  const infoIconRef = useRef(null);
  const [isPulse, setIsPulse] = useState(false);
  const prevValueRef = useRef(value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const numericValue =
    typeof value === "number" ? Math.round(value) : parseInt(value, 10) || 3;

  // Calculate percentage for progress bar width
  const calculatePercentage = (value) => {
    return ((value - 1) / 4) * 100; // Scale from 1-5 to 0-100%
  };

  // Add pulse animation when value changes
  useEffect(() => {
    if (prevValueRef.current !== numericValue) {
      setIsPulse(true);
      const timer = setTimeout(() => setIsPulse(false), 500);
      prevValueRef.current = numericValue;
      return () => clearTimeout(timer);
    }
  }, [numericValue]);

  // Update range slider position variables for tooltip
  useEffect(() => {
    const updateRangePosition = () => {
      if (rangeRef.current) {
        const element = rangeRef.current;
        const min = element.min || 1;
        const max = element.max || 5;
        const percent = ((numericValue - min) / (max - min)) * 100;
        element.style.setProperty("--range-percent", `${percent}%`);
      }
    };

    updateRangePosition();

    // Setup event listener for range input
    const element = rangeRef.current;
    if (element) {
      element.addEventListener("input", updateRangePosition);
    }

    return () => {
      if (element) {
        element.removeEventListener("input", updateRangePosition);
      }
    };
  }, [numericValue]);

  const percentage = calculatePercentage(numericValue);

  // Get descriptive text based on value
  const getValueDescription = (trait, value) => {
    const descriptions = {
      openness: ["Very conventional", "Somewhat conventional", "Balanced", "Somewhat open", "Very open"],
      conscientiousness: ["Very disorganized", "Somewhat disorganized", "Balanced", "Somewhat conscientious", "Very conscientious"],
      extraversion: ["Very introverted", "Somewhat introverted", "Balanced", "Somewhat extraverted", "Very extraverted"],
      agreeableness: ["Very direct", "Somewhat direct", "Balanced", "Somewhat agreeable", "Very agreeable"],
      neuroticism: ["Very stable", "Somewhat stable", "Balanced", "Somewhat sensitive", "Very sensitive"]
    };
    
    return descriptions[trait] ? descriptions[trait][value - 1] : "";
  };

  // Show trait info in modal
  const openTraitInfoModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  // Close trait info modal
  const closeTraitInfoModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={`trait-control ${trait}`}>
      <label htmlFor={trait}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {formatTrait(trait)}
          <div 
            className="trait-info-icon" 
            onClick={openTraitInfoModal}
            ref={infoIconRef}
            aria-label={`Show information about ${formatTrait(trait)}`}
            role="button"
            tabIndex="0"
          >
            ?
          </div>
        </div>
        <span className="trait-value">({numericValue})</span>
      </label>
      <p className="trait-description">{TRAIT_DESCRIPTIONS[trait]}</p>

      <div className="trait-progress">
        <div
          className={`trait-progress-bar ${trait}-bar`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <input
        type="range"
        id={trait}
        name={trait}
        min="1"
        max="5"
        step="1"
        value={numericValue}
        onChange={(e) => onChange(trait, e.target.value)}
        disabled={disabled}
        ref={rangeRef}
        className={isPulse ? "pulse" : ""}
        aria-valuetext={`${numericValue} - ${getValueDescription(trait, numericValue)}`}
      />
      
      <div className="trait-range">
        <span>{getValueDescription(trait, 1)}</span>
        <span>{getValueDescription(trait, 5)}</span>
      </div>

      {/* Modal for trait information */}
      <TraitInfoModal
        trait={trait}
        traitInfo={DETAILED_TRAIT_DESCRIPTIONS[trait]}
        isOpen={isModalOpen}
        onClose={closeTraitInfoModal}
      />
    </div>
  );
};

export default TraitSlider;
