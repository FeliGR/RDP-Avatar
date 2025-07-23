import React, { useEffect, useRef, useState } from "react";
import { useVoiceConfig } from "../context/VoiceConfigContext";
import "./VoiceParameterSlider.css";

const VoiceParameterSlider = ({ parameter, config, value, disabled = false }) => {
  const { updateSpeakingRate, updatePitch } = useVoiceConfig();
  const rangeRef = useRef(null);
  const [isPulse, setIsPulse] = useState(false);
  const prevValueRef = useRef(value);

  const updateValue = (newValue) => {
    if (parameter === "speakingRate") {
      updateSpeakingRate(newValue);
    } else if (parameter === "pitch") {
      updatePitch(newValue);
    }
  };

  const handleChange = (event) => {
    const newValue = parseFloat(event.target.value);
    updateValue(newValue);
  };

  const handleReset = () => {
    updateValue(config.default);
  };

  // Calculate percentage for visual indicator
  const calculatePercentage = (value) => {
    return ((value - config.min) / (config.max - config.min)) * 100;
  };

  // Pulse effect when value changes
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsPulse(true);
      const timer = setTimeout(() => setIsPulse(false), 500);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  // Update CSS custom property for range styling
  useEffect(() => {
    const updateRangePosition = () => {
      if (rangeRef.current) {
        const percent = calculatePercentage(value);
        rangeRef.current.style.setProperty("--range-percent", `${percent}%`);
      }
    };
    updateRangePosition();
  }, [value, config.min, config.max]);

  const percentage = calculatePercentage(value);
  const displayValue = value.toFixed(parameter === "pitch" ? 1 : 1);

  return (
    <div className="voice-parameter-slider">
      <div className="voice-parameter-slider__header">
        <label className="voice-parameter-slider__label" htmlFor={`${parameter}-slider`}>
          {config.label}
        </label>
        <div className="voice-parameter-slider__value-wrapper">
          <span
            className={`voice-parameter-slider__value ${isPulse ? "pulse" : ""}`}
            title={config.description}
          >
            {displayValue}
            {config.unit}
          </span>
          <button
            type="button"
            className="voice-parameter-slider__reset"
            onClick={handleReset}
            disabled={disabled || value === config.default}
            title="Reset to default"
            aria-label={`Reset ${config.label} to default`}
          >
            ↻
          </button>
        </div>
      </div>

      <div className="voice-parameter-slider__slider-wrapper">
        <input
          ref={rangeRef}
          id={`${parameter}-slider`}
          type="range"
          className="voice-parameter-slider__slider"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-describedby={`${parameter}-description`}
        />
        <div className="voice-parameter-slider__track-fill" style={{ width: `${percentage}%` }} />
      </div>

      <div className="voice-parameter-slider__range-labels">
        <span className="voice-parameter-slider__range-label">
          {config.min}
          {config.unit}
        </span>
        <span className="voice-parameter-slider__range-label">
          {config.default}
          {config.unit}
        </span>
        <span className="voice-parameter-slider__range-label">
          {config.max}
          {config.unit}
        </span>
      </div>

      <div id={`${parameter}-description`} className="voice-parameter-slider__description">
        {config.description}
      </div>
    </div>
  );
};

export default VoiceParameterSlider;
