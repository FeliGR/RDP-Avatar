import React, { useEffect } from "react";
import { usePersonality } from "../context/PersonalityContext";
import "./PersonalityControls.css";

const PersonalityControls = () => {
  const { personalityTraits, updateTrait, isLoading, error } = usePersonality();

  const handleTraitChange = async (trait, value) => {
    // Convert to integer instead of float
    await updateTrait(trait, parseInt(value, 10));
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

  // Debug output to check the structure of personalityTraits
  useEffect(() => {
    console.log("Personality traits:", personalityTraits);
  }, [personalityTraits]);

  // Ensure personalityTraits is properly initialized
  const validTraits = personalityTraits || {};
  
  // Define the Big Five traits explicitly to ensure they're always shown
  const bigFiveTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  
  return (
    <div className="personality-controls">
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading-message">Loading personality profile...</div>}

      {bigFiveTraits.map(trait => {
        // Get the trait value or use default if not available
        const value = validTraits[trait] !== undefined ? validTraits[trait] : 3;
        
        // Ensure value is a whole number
        const numericValue = typeof value === 'number' ? Math.round(value) : parseInt(value, 10) || 3;
        
        // Calculate progress bar width
        const percentage = calculatePercentage(numericValue);

        return (
          <div key={trait} className="trait-control">
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
