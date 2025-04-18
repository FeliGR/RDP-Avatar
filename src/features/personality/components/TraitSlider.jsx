import React, { useEffect, useRef } from 'react';
import { formatTrait, TRAIT_DESCRIPTIONS } from '../constants';

/**
 * TraitSlider component for individual personality trait control
 */
const TraitSlider = ({ 
  trait, 
  value, 
  onChange, 
  disabled = false 
}) => {
  const rangeRef = useRef(null);
  const numericValue = typeof value === 'number' ? Math.round(value) : parseInt(value, 10) || 3;

  // Calculate percentage for progress bar width
  const calculatePercentage = (value) => {
    return ((value - 1) / 4) * 100; // Scale from 1-5 to 0-100%
  };
  
  // Update range slider position variables for tooltip
  useEffect(() => {
    const updateRangePosition = () => {
      if (rangeRef.current) {
        const element = rangeRef.current;
        const min = element.min || 1;
        const max = element.max || 5;
        const percent = ((numericValue - min) / (max - min)) * 100;
        element.style.setProperty('--range-percent', `${percent}%`);
      }
    };
    
    updateRangePosition();
    
    // Setup event listener for range input
    const element = rangeRef.current;
    if (element) {
      element.addEventListener('input', updateRangePosition);
    }
    
    return () => {
      if (element) {
        element.removeEventListener('input', updateRangePosition);
      }
    };
  }, [numericValue]);
  
  const percentage = calculatePercentage(numericValue);

  return (
    <div className={`trait-control ${trait}`}>
      <label htmlFor={trait}>
        {formatTrait(trait)}
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
      />
      <div className="trait-range">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
};

export default TraitSlider;