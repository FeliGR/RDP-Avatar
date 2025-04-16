import React, { createContext, useContext, useEffect, useState } from "react";
import { getPersonaProfile, updatePersonaTrait } from "../services/api";

// Default personality traits
const DEFAULT_PERSONALITY = {
  openness: 3.0,
  conscientiousness: 3.0,
  extraversion: 3.0,
  agreeableness: 3.0,
  neuroticism: 3.0,
  userId: 1, // This would typically come from authentication
};

// Create the context
export const PersonalityContext = createContext();

// Custom hook for accessing the context
export const usePersonality = () => useContext(PersonalityContext);

// Provider component
export const PersonalityProvider = ({ children }) => {
  const [personalityTraits, setPersonalityTraits] =
    useState(DEFAULT_PERSONALITY);
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

  // Update a single personality trait
  const updateTrait = async (trait, value) => {
    try {
      setIsLoading(true);
      
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
      setIsLoading(false);
    }
  };

  return (
    <PersonalityContext.Provider
      value={{
        personalityTraits,
        isLoading,
        error,
        updateTrait,
        apiAvailable
      }}
    >
      {children}
    </PersonalityContext.Provider>
  );
};
