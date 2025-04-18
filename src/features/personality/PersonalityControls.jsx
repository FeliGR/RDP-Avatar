import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePersonality } from "./PersonalityContext";
import "./PersonalityControls.css";

// Debounce utility function
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
  
  return debouncedCallback;
};

const PersonalityControls = () => {
  const { personalityTraits, updateTrait, isLoading, error } = usePersonality();
  const rangeRefs = useRef({});
  // Local state for immediate UI feedback
  const [localTraits, setLocalTraits] = useState({});
  
  // Initialize local traits from context when it changes
  useEffect(() => {
    setLocalTraits(personalityTraits || {});
  }, [personalityTraits]);

  // Debounced function to update trait in the backend
  const debouncedUpdateTrait = useDebounce((trait, value) => {
    updateTrait(trait, value);
  }, 400); // 400ms debounce time

  const handleTraitChange = (trait, value) => {
    const numericValue = parseInt(value, 10);
    
    // Update local state immediately for responsive UI
    setLocalTraits(prev => ({
      ...prev,
      [trait]: numericValue
    }));
    
    // Debounce the actual API call
    debouncedUpdateTrait(trait, numericValue);
  };

  const traitDescriptions = {
    openness: "Curiosity and openness to new experiences",
    conscientiousness: "Organized and focused on goals",
    extraversion: "Social and outgoing nature",
    agreeableness: "Friendly and cooperative attitude",
    neuroticism: "Emotional stability and reactions to stress",
  };

  // Format trait for display (capitalize first letter)
  const formatTrait = (trait) => {
    return trait.charAt(0).toUpperCase() + trait.slice(1);
  };

  // Calculate percentage for progress bar width
  const calculatePercentage = (value) => {
    return ((value - 1) / 4) * 100; // Scale from 1-5 to 0-100%
  };

  // Update range slider position variables for tooltips
  useEffect(() => {
    const updateRangePositions = () => {
      Object.entries(rangeRefs.current).forEach(([trait, element]) => {
        if (element) {
          const value = element.value;
          const min = element.min || 1;
          const max = element.max || 5;
          const percent = ((value - min) / (max - min)) * 100;
          element.style.setProperty('--range-percent', `${percent}%`);
        }
      });
    };
    
    updateRangePositions();
    
    // Setup event listeners for all range inputs
    Object.values(rangeRefs.current).forEach(element => {
      if (element) {
        element.addEventListener('input', updateRangePositions);
      }
    });
    
    return () => {
      Object.values(rangeRefs.current).forEach(element => {
        if (element) {
          element.removeEventListener('input', updateRangePositions);
        }
      });
    };
  }, [localTraits]); // Changed dependency to localTraits
  
  // Define the Big Five traits explicitly to ensure they're always shown
  const bigFiveTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  
  return (
    <div className="personality-controls">
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading-indicator" aria-label="Loading..."></div>}

      {bigFiveTraits.map(trait => {
        // Use local traits for immediate UI feedback
        const traitFromState = localTraits[trait];
        const value = traitFromState !== undefined ? traitFromState : 3;
        
        // Ensure value is a whole number
        const numericValue = typeof value === 'number' ? Math.round(value) : parseInt(value, 10) || 3;
        
        // Calculate progress bar width
        const percentage = calculatePercentage(numericValue);

        return (
          <div key={trait} className={`trait-control ${trait}`}>
            <label htmlFor={trait}>
              {formatTrait(trait)}
              <span className="trait-value">({numericValue})</span>
            </label>
            <p className="trait-description">{traitDescriptions[trait]}</p>

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
              onChange={(e) => handleTraitChange(trait, e.target.value)}
              disabled={isLoading}
              ref={el => rangeRefs.current[trait] = el}
            />
            <div className="trait-range">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PersonalityControls;
