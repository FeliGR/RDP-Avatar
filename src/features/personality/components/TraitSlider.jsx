import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDetailedTraitDescriptions, getTraitDescriptions } from "../constants/constants";
import { formatTrait } from "../../../shared/utils";
import TraitInfoModal from "./TraitInfoModal";
import "./TraitInfoModal.css";

const TraitSlider = ({ trait, value, onChange, disabled = false }) => {
  const { t } = useTranslation();
  const rangeRef = useRef(null);
  const infoIconRef = useRef(null);
  const [isPulse, setIsPulse] = useState(false);
  const prevValueRef = useRef(value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const numericValue = typeof value === "number" ? Math.round(value) : parseInt(value, 10) || 3;
  
  const traitDescriptions = getTraitDescriptions(t);
  const detailedTraitDescriptions = getDetailedTraitDescriptions(t);
  
  const calculatePercentage = (value) => {
    return ((value - 1) / 4) * 100;
  };

  useEffect(() => {
    if (prevValueRef.current !== numericValue) {
      setIsPulse(true);
      const timer = setTimeout(() => setIsPulse(false), 500);
      prevValueRef.current = numericValue;
      return () => clearTimeout(timer);
    }
  }, [numericValue]);

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

  const getValueDescription = (trait, value) => {
    const descriptions = {
      openness: [
        "Very conventional",
        "Somewhat conventional",
        "Balanced",
        "Somewhat creative",
        "Very creative",
      ],
      conscientiousness: [
        "Very spontaneous",
        "Somewhat spontaneous",
        "Balanced",
        "Somewhat organized",
        "Very organized",
      ],
      extraversion: [
        "Very introverted",
        "Somewhat introverted",
        "Balanced",
        "Somewhat extraverted",
        "Very extraverted",
      ],
      agreeableness: [
        "Very direct",
        "Somewhat direct",
        "Balanced",
        "Somewhat agreeable",
        "Very agreeable",
      ],
      neuroticism: [
        "Very stable",
        "Somewhat stable",
        "Balanced",
        "Somewhat sensitive",
        "Very sensitive",
      ],
    };
    return descriptions[trait]?.[value - 1] || "Balanced";
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={`trait-control ${trait}`}>
      <label htmlFor={trait}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {t(`personality.traits.${trait}`)}
          <div
            className="trait-info-icon"
            onClick={handleOpenModal}
            ref={infoIconRef}
            aria-label={t('common.moreInformationAbout', { trait: t(`personality.traits.${trait}`) })}
            role="button"
            tabIndex="0"
          >
            ⓘ
          </div>
        </div>
        <span className={`trait-value ${isPulse ? "pulse" : ""}`}>({numericValue})</span>
      </label>
      <p className="trait-description">{traitDescriptions[trait]}</p>
      <div className="trait-progress">
        <div className={`trait-progress-bar ${trait}-bar`} style={{ width: `${percentage}%` }} />
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
      {isModalOpen && (
        <TraitInfoModal
          trait={trait}
          detailedInfo={detailedTraitDescriptions[trait]}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default TraitSlider;
