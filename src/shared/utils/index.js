/**
 * Formats a trait name for display
 * @param {string} trait - The trait name
 * @returns {string} Formatted trait name
 */
export const formatTrait = (trait) => {
  return trait
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
