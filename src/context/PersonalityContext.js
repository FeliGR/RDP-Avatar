import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPersonaProfile, updatePersonaTrait } from '../services/api';

// Default personality traits
const DEFAULT_PERSONALITY = {
  openness: 3.0,
  conscientiousness: 3.0,
  extraversion: 3.0,
  agreeableness: 3.0,
  neuroticism: 3.0,
  userId: 1 // This would typically come from authentication
};

// Create the context
export const PersonalityContext = createContext();

// Custom hook for accessing the context
export const usePersonality = () => useContext(PersonalityContext);

// Provider component
export const PersonalityProvider = ({ children }) => {
  const [personalityTraits, setPersonalityTraits] = useState(DEFAULT_PERSONALITY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial personality data
  useEffect(() => {
    const fetchPersonalityData = async () => {
      try {
        setIsLoading(true);
        const userId = personalityTraits.userId;
        const data = await getPersonaProfile(userId);
        setPersonalityTraits({ ...data, userId });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch personality data:', err);
        setError('Failed to load personality profile. Using default values.');
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
      const userId = personalityTraits.userId;
      await updatePersonaTrait(userId, trait, value);
      setPersonalityTraits(prev => ({ ...prev, [trait]: value }));
      return true;
    } catch (err) {
      console.error(`Failed to update ${trait}:`, err);
      setError(`Failed to update ${trait}. Please try again.`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PersonalityContext.Provider value={{ 
      personalityTraits, 
      isLoading, 
      error,
      updateTrait 
    }}>
      {children}
    </PersonalityContext.Provider>
  );
};