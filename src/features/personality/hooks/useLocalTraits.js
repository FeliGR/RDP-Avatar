import { useEffect, useState } from "react";

/**
 * Custom hook to manage local personality traits state
 * @param {Object} contextTraits - Personality traits from context
 * @returns {Array} - [localTraits, setLocalTraits]
 */
const useLocalTraits = (contextTraits) => {
  const [localTraits, setLocalTraits] = useState({});

  // Sync local traits with context when context changes
  useEffect(() => {
    if (contextTraits) {
      setLocalTraits(contextTraits);
    }
  }, [contextTraits]);

  /**
   * Update a single local trait
   * @param {string} trait - The trait name
   * @param {number} value - The new value
   */
  const updateLocalTrait = (trait, value) => {
    setLocalTraits((prev) => ({
      ...prev,
      [trait]: typeof value === "number" ? value : parseInt(value, 10),
    }));
  };

  return [localTraits, updateLocalTrait];
};

export default useLocalTraits;
