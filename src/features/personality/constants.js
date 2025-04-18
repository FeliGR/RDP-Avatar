/**
 * Default personality trait values
 */
export const DEFAULT_PERSONALITY = {
  openness: 3.0,
  conscientiousness: 3.0,
  extraversion: 3.0,
  agreeableness: 3.0,
  neuroticism: 3.0,
  userId: 1, // This would typically come from authentication
};

/**
 * The Big Five personality traits
 */
export const BIG_FIVE_TRAITS = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism'
];

/**
 * Descriptive text for each personality trait
 */
export const TRAIT_DESCRIPTIONS = {
  openness: "Curiosity and openness to new experiences",
  conscientiousness: "Organized and focused on goals",
  extraversion: "Social and outgoing nature",
  agreeableness: "Friendly and cooperative attitude",
  neuroticism: "Emotional stability and reactions to stress",
};

/**
 * Maps simplified trait terms to full trait names
 */
export const TRAIT_NAME_MAP = {
  open: "openness",
  conscientious: "conscientiousness",
  extraverted: "extraversion",
  agreeable: "agreeableness",
  neurotic: "neuroticism",
};

/**
 * Helper function to format trait for display (capitalize first letter)
 */
export const formatTrait = (trait) => {
  return trait.charAt(0).toUpperCase() + trait.slice(1);
};