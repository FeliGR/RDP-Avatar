import React, { createContext, useContext, useEffect, useState } from "react";
import { getPersonaProfile, updatePersonaTrait } from "../../../services/api";
import { DEFAULT_PERSONALITY } from "../constants/constants";

const normalizePersonalityData = (raw) => {
  try {
    const source = raw?.data ?? raw?.profile ?? raw?.persona ?? raw ?? {};
    const traits = source?.traits ?? source;

    const mapAlt = {
      openness: ["open"],
      conscientiousness: ["conscientious"],
      extraversion: ["extraverted"],
      agreeableness: ["agreeable"],
      neuroticism: ["neurotic"],
    };

    const result = {};
    Object.keys(mapAlt).forEach((key) => {
      let val = traits?.[key];
      if (val === undefined) {
        for (const alt of mapAlt[key]) {
          if (traits && traits[alt] !== undefined) {
            val = traits[alt];
            break;
          }
        }
      }
      if (typeof val === "string") val = parseFloat(val);
      if (typeof val === "number" && !Number.isNaN(val)) {
        const clamped = Math.min(5, Math.max(1, Math.round(val)));
        result[key] = clamped;
      }
    });

    return result;
  } catch (_) {
    return {};
  }
};

export const PersonalityContext = createContext();
export const usePersonality = () => useContext(PersonalityContext);
export const PersonalityProvider = ({ children }) => {
  const [personalityTraits, setPersonalityTraits] = useState(DEFAULT_PERSONALITY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  useEffect(() => {
    const fetchPersonalityData = async () => {
      try {
        setIsLoading(true);
        const userId = personalityTraits.userId;
        const apiData = await getPersonaProfile(userId);
        const normalized = normalizePersonalityData(apiData);

        setPersonalityTraits({ ...DEFAULT_PERSONALITY, ...normalized, userId });
        setError(null);
        setApiAvailable(true);
      } catch (err) {
        setApiAvailable(false);
        setError("Using default personality settings (API server unavailable)");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPersonalityData();
  }, [personalityTraits.userId]);

  const updateTrait = async (trait, value, options = { showLoading: false }) => {
    if (!trait || value === undefined) {
      return false;
    }
    try {
      if (options.showLoading) {
        setIsLoading(true);
      }
      setPersonalityTraits((prev) => ({ ...prev, [trait]: value }));
      if (apiAvailable) {
        const userId = personalityTraits.userId;
        await updatePersonaTrait(userId, trait, value);
      }
      return true;
    } catch (err) {
      setApiAvailable(false);
      setError(`Personality trait updated locally only (API server unavailable)`);
      return true;
    } finally {
      if (options.showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleTraitAction = async (trait, action, amount = 0.5) => {
    if (!trait || !action) {
      return false;
    }
    try {
      const currentValue = personalityTraits[trait] || 3;
      let newValue;
      switch (action) {
        case "increase":
          newValue = Math.min(5, currentValue + amount);
          break;
        case "decrease":
          newValue = Math.max(1, currentValue - amount);
          break;
        case "set":
          newValue = Math.min(5, Math.max(1, amount));
          break;
        default:
          return false;
      }
      return await updateTrait(trait, newValue, { showLoading: true });
    } catch (err) {
      return false;
    }
  };

  const contextValue = {
    personalityTraits,
    isLoading,
    error,
    updateTrait,
    handleTraitAction,
    apiAvailable,
  };
  return <PersonalityContext.Provider value={contextValue}>{children}</PersonalityContext.Provider>;
};
