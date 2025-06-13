import React, { createContext, useContext, useEffect, useState } from "react";
import { getPersonaProfile, updatePersonaTrait } from "../../../services/api";
import { DEFAULT_PERSONALITY } from "../constants/constants";

// Create the context
export const PersonalityContext = createContext();

// Custom hook for accessing the context
export const usePersonality = () => useContext(PersonalityContext);

// Provider component
export const PersonalityProvider = ({ children }) => {
  const [personalityTraits, setPersonalityTraits] = useState(DEFAULT_PERSONALITY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Load initial personality data
  useEffect(() => {
    const fetchPersonalityData = async () => {
      try {
        setIsLoading(true);
        const userId = personalityTraits.userId;
        const data = await getPersonaProfile(userId);
        setPersonalityTraits({ ...data, userId });
        setError(null);
        setApiAvailable(true);
      } catch (err) {
        console.error("Failed to fetch personality data:", err);
        setApiAvailable(false);
        // Use a more friendly error message
        setError("Using default personality settings (API server unavailable)");
        // Keep using default values if API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonalityData();
  }, []);

  /**
   * Update a single personality trait
   * @param {string} trait - The trait name (e.g., "openness")
   * @param {number} value - The new value for the trait
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} - Success status
   */
  const updateTrait = async (trait, value, options = { showLoading: false }) => {
    if (!trait || value === undefined) {
      console.error(`Invalid trait update: ${trait}=${value}`);
      return false;
    }

    try {
      // Only show loading indicator if explicitly requested
      // This helps prevent flickering during slider interactions
      if (options.showLoading) {
        setIsLoading(true);
      }

      // Update local state immediately for responsive UI
      setPersonalityTraits((prev) => ({ ...prev, [trait]: value }));

      // Only attempt API call if we believe the API is available
      if (apiAvailable) {
        const userId = personalityTraits.userId;
        await updatePersonaTrait(userId, trait, value);
      } else {
        console.log(`API unavailable, trait ${trait} updated locally only`);
      }

      return true;
    } catch (err) {
      console.error(`Failed to update ${trait}:`, err);
      setApiAvailable(false);
      setError(`Personality trait updated locally only (API server unavailable)`);
      // We still return true since we updated the UI state
      return true;
    } finally {
      if (options.showLoading) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Update personality trait based on voice commands
   * @param {string} trait - The trait to update
   * @param {string} action - "increase", "decrease", or "set"
   * @param {number} amount - Amount to change
   * @returns {boolean} - Success status
   */
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
      console.error(`Failed to handle trait action: ${trait} ${action}`, err);
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
