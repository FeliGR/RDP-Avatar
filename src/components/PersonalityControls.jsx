import React from 'react';
import { usePersonality } from '../context/PersonalityContext';
import './PersonalityControls.css';

const PersonalityControls = () => {
  const { personalityTraits, updateTrait, isLoading, error } = usePersonality();

  const handleTraitChange = async (trait, value) => {
    await updateTrait(trait, parseFloat(value));
  };

  const traitDescriptions = {
    openness: 'Curiosity and openness to new experiences',
    conscientiousness: 'Organized and focused on goals',
    extraversion: 'Social and outgoing nature',
    agreeableness: 'Friendly and cooperative attitude',
    neuroticism: 'Emotional stability and reactions to stress'
  };

  // Format trait for display (capitalize first letter)
  const formatTrait = (trait) => {
    return trait.charAt(0).toUpperCase() + trait.slice(1);
  };

  // Calculate percentage for progress bar width
  const calculatePercentage = (value) => {
    return ((value - 1) / 4) * 100; // Scale from 1-5 to 0-100%
  };

  return (
    <div className="personality-controls">
      <h2>Personality Profile</h2>
      {error && <div className="error-message">{error}</div>}
      
      {Object.entries(personalityTraits).map(([trait, value]) => {
        // Skip the userId field
        if (trait === 'userId') return null;
        
        // Calculate progress bar width
        const percentage = calculatePercentage(value);
        
        return (
          <div key={trait} className="trait-control">
            <label htmlFor={trait}>
              {formatTrait(trait)} 
              <span className="trait-value">({value.toFixed(1)})</span>
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
              min="1.0"
              max="5.0"
              step="0.1"
              value={value}
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