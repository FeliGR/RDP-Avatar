/**
 * Centralized GLB Assets Configuration
 * This file contains all GLB file paths used throughout the application
 * to avoid hardcoded paths scattered across the codebase.
 */

// Base paths for different asset types
const BASE_PATHS = {
  ANIMATIONS: "/animations",
  MODELS: "/assets/models",
  FEMININE: "/animations/feminine",
  MASCULINE: "/animations/masculine",
};

// Main models
export const MODELS = {
  BASE: "/assets/models/base.glb",
};

// T-Pose models
export const T_POSE = {
  FEMININE: "/animations/feminine/Feminine_TPose.glb",
  MASCULINE: "/animations/masculine/Masculine_TPose.glb",
};

// Idle animations
export const IDLE_ANIMATIONS = {
  FEMININE: {
    F_STANDING_IDLE_001: "/animations/feminine/idle/F_Standing_Idle_001.glb",
    F_STANDING_IDLE_VARIATIONS_001: "/animations/feminine/idle/F_Standing_Idle_Variations_001.glb",
    F_STANDING_IDLE_VARIATIONS_002: "/animations/feminine/idle/F_Standing_Idle_Variations_002.glb",
    F_STANDING_IDLE_VARIATIONS_003: "/animations/feminine/idle/F_Standing_Idle_Variations_003.glb",
    F_STANDING_IDLE_VARIATIONS_004: "/animations/feminine/idle/F_Standing_Idle_Variations_004.glb",
    F_STANDING_IDLE_VARIATIONS_005: "/animations/feminine/idle/F_Standing_Idle_Variations_005.glb",
    F_STANDING_IDLE_VARIATIONS_006: "/animations/feminine/idle/F_Standing_Idle_Variations_006.glb",
    F_STANDING_IDLE_VARIATIONS_007: "/animations/feminine/idle/F_Standing_Idle_Variations_007.glb",
    F_STANDING_IDLE_VARIATIONS_008: "/animations/feminine/idle/F_Standing_Idle_Variations_008.glb",
    F_STANDING_IDLE_VARIATIONS_009: "/animations/feminine/idle/F_Standing_Idle_Variations_009.glb",
  },
  MASCULINE: {
    M_STANDING_IDLE_001: "/animations/masculine/idle/M_Standing_Idle_001.glb",
    M_STANDING_IDLE_002: "/animations/masculine/idle/M_Standing_Idle_002.glb",
    M_STANDING_IDLE_VARIATIONS_001: "/animations/masculine/idle/M_Standing_Idle_Variations_001.glb",
    M_STANDING_IDLE_VARIATIONS_002: "/animations/masculine/idle/M_Standing_Idle_Variations_002.glb",
    M_STANDING_IDLE_VARIATIONS_003: "/animations/masculine/idle/M_Standing_Idle_Variations_003.glb",
    M_STANDING_IDLE_VARIATIONS_004: "/animations/masculine/idle/M_Standing_Idle_Variations_004.glb",
    M_STANDING_IDLE_VARIATIONS_005: "/animations/masculine/idle/M_Standing_Idle_Variations_005.glb",
    M_STANDING_IDLE_VARIATIONS_006: "/animations/masculine/idle/M_Standing_Idle_Variations_006.glb",
    M_STANDING_IDLE_VARIATIONS_007: "/animations/masculine/idle/M_Standing_Idle_Variations_007.glb",
    M_STANDING_IDLE_VARIATIONS_008: "/animations/masculine/idle/M_Standing_Idle_Variations_008.glb",
    M_STANDING_IDLE_VARIATIONS_009: "/animations/masculine/idle/M_Standing_Idle_Variations_009.glb",
    M_STANDING_IDLE_VARIATIONS_010: "/animations/masculine/idle/M_Standing_Idle_Variations_010.glb",
  },
};

// Expression animations
export const EXPRESSION_ANIMATIONS = {
  FEMININE: {
    F_TALKING_VARIATIONS_001: "/animations/feminine/expression/F_Talking_Variations_001.glb",
    F_TALKING_VARIATIONS_002: "/animations/feminine/expression/F_Talking_Variations_002.glb",
    F_TALKING_VARIATIONS_003: "/animations/feminine/expression/F_Talking_Variations_003.glb",
    F_TALKING_VARIATIONS_004: "/animations/feminine/expression/F_Talking_Variations_004.glb",
    F_TALKING_VARIATIONS_005: "/animations/feminine/expression/F_Talking_Variations_005.glb",
    F_TALKING_VARIATIONS_006: "/animations/feminine/expression/F_Talking_Variations_006.glb",
  },
  MASCULINE: {
    M_STANDING_EXPRESSIONS_001: "/animations/masculine/expression/M_Standing_Expressions_001.glb",
    M_STANDING_EXPRESSIONS_002: "/animations/masculine/expression/M_Standing_Expressions_002.glb",
    M_STANDING_EXPRESSIONS_004: "/animations/masculine/expression/M_Standing_Expressions_004.glb",
    M_STANDING_EXPRESSIONS_005: "/animations/masculine/expression/M_Standing_Expressions_005.glb",
    M_STANDING_EXPRESSIONS_006: "/animations/masculine/expression/M_Standing_Expressions_006.glb",
    M_STANDING_EXPRESSIONS_007: "/animations/masculine/expression/M_Standing_Expressions_007.glb",
    M_STANDING_EXPRESSIONS_008: "/animations/masculine/expression/M_Standing_Expressions_008.glb",
    M_STANDING_EXPRESSIONS_009: "/animations/masculine/expression/M_Standing_Expressions_009.glb",
    M_STANDING_EXPRESSIONS_010: "/animations/masculine/expression/M_Standing_Expressions_010.glb",
    M_STANDING_EXPRESSIONS_011: "/animations/masculine/expression/M_Standing_Expressions_011.glb",
    M_STANDING_EXPRESSIONS_012: "/animations/masculine/expression/M_Standing_Expressions_012.glb",
    M_STANDING_EXPRESSIONS_013: "/animations/masculine/expression/M_Standing_Expressions_013.glb",
    M_STANDING_EXPRESSIONS_014: "/animations/masculine/expression/M_Standing_Expressions_014.glb",
    M_STANDING_EXPRESSIONS_015: "/animations/masculine/expression/M_Standing_Expressions_015.glb",
    M_STANDING_EXPRESSIONS_016: "/animations/masculine/expression/M_Standing_Expressions_016.glb",
    M_STANDING_EXPRESSIONS_017: "/animations/masculine/expression/M_Standing_Expressions_017.glb",
    M_STANDING_EXPRESSIONS_018: "/animations/masculine/expression/M_Standing_Expressions_018.glb",
    M_TALKING_VARIATIONS_001: "/animations/masculine/expression/M_Talking_Variations_001.glb",
    M_TALKING_VARIATIONS_002: "/animations/masculine/expression/M_Talking_Variations_002.glb",
    M_TALKING_VARIATIONS_003: "/animations/masculine/expression/M_Talking_Variations_003.glb",
    M_TALKING_VARIATIONS_004: "/animations/masculine/expression/M_Talking_Variations_004.glb",
    M_TALKING_VARIATIONS_005: "/animations/masculine/expression/M_Talking_Variations_005.glb",
    M_TALKING_VARIATIONS_006: "/animations/masculine/expression/M_Talking_Variations_006.glb",
    M_TALKING_VARIATIONS_007: "/animations/masculine/expression/M_Talking_Variations_007.glb",
    M_TALKING_VARIATIONS_008: "/animations/masculine/expression/M_Talking_Variations_008.glb",
    M_TALKING_VARIATIONS_009: "/animations/masculine/expression/M_Talking_Variations_009.glb",
    M_TALKING_VARIATIONS_010: "/animations/masculine/expression/M_Talking_Variations_010.glb",
  },
};

// Dance animations
export const DANCE_ANIMATIONS = {
  FEMININE: {
    F_DANCES_001: "/animations/feminine/dance/F_Dances_001.glb",
    F_DANCES_004: "/animations/feminine/dance/F_Dances_004.glb",
    F_DANCES_005: "/animations/feminine/dance/F_Dances_005.glb",
    F_DANCES_006: "/animations/feminine/dance/F_Dances_006.glb",
    F_DANCES_007: "/animations/feminine/dance/F_Dances_007.glb",
  },
  MASCULINE: {
    M_DANCES_001: "/animations/masculine/dance/M_Dances_001.glb",
    M_DANCES_002: "/animations/masculine/dance/M_Dances_002.glb",
    M_DANCES_003: "/animations/masculine/dance/M_Dances_003.glb",
    M_DANCES_004: "/animations/masculine/dance/M_Dances_004.glb",
    M_DANCES_005: "/animations/masculine/dance/M_Dances_005.glb",
    M_DANCES_006: "/animations/masculine/dance/M_Dances_006.glb",
    M_DANCES_007: "/animations/masculine/dance/M_Dances_007.glb",
    M_DANCES_008: "/animations/masculine/dance/M_Dances_008.glb",
    M_DANCES_009: "/animations/masculine/dance/M_Dances_009.glb",
    M_DANCES_011: "/animations/masculine/dance/M_Dances_011.glb",
  },
};

// Utility functions to get animation arrays
export const getAnimationArrays = () => ({
  // Default animations used in useAvatarAnimations - ALL animations for maximum variety
  DEFAULT_ANIMATIONS: [
    // All idle animations
    ...Object.values(IDLE_ANIMATIONS.MASCULINE),
    ...Object.values(IDLE_ANIMATIONS.FEMININE),
    // All expression animations
    ...Object.values(EXPRESSION_ANIMATIONS.MASCULINE),
    ...Object.values(EXPRESSION_ANIMATIONS.FEMININE),
    // All dance animations
    ...Object.values(DANCE_ANIMATIONS.MASCULINE),
    ...Object.values(DANCE_ANIMATIONS.FEMININE),
  ],

  // AI Response animations - ALL animations for maximum variety
  AI_RESPONSE_ANIMATIONS: [
    // All expression animations (masculine)
    ...Object.values(EXPRESSION_ANIMATIONS.MASCULINE),
    // All expression animations (feminine)
    ...Object.values(EXPRESSION_ANIMATIONS.FEMININE),
    // All dance animations for dynamic responses
    ...Object.values(DANCE_ANIMATIONS.MASCULINE),
    ...Object.values(DANCE_ANIMATIONS.FEMININE),
  ],

  // All talking animations specifically for speech synthesis
  TALKING_ANIMATIONS: [
    ...Object.values(EXPRESSION_ANIMATIONS.MASCULINE).filter((path) => path.includes("Talking")),
    ...Object.values(EXPRESSION_ANIMATIONS.FEMININE).filter((path) => path.includes("Talking")),
  ],

  // Get all animations by category
  ALL_EXPRESSION_ANIMATIONS: [
    ...Object.values(EXPRESSION_ANIMATIONS.FEMININE),
    ...Object.values(EXPRESSION_ANIMATIONS.MASCULINE),
  ],

  ALL_DANCE_ANIMATIONS: [
    ...Object.values(DANCE_ANIMATIONS.FEMININE),
    ...Object.values(DANCE_ANIMATIONS.MASCULINE),
  ],

  ALL_IDLE_ANIMATIONS: [
    ...Object.values(IDLE_ANIMATIONS.FEMININE),
    ...Object.values(IDLE_ANIMATIONS.MASCULINE),
  ],
});

// Utility functions to filter animations by category
export const getAnimationsByCategory = (category) => {
  const animations = getAnimationArrays();

  switch (category) {
    case "expression":
      return animations.ALL_EXPRESSION_ANIMATIONS;
    case "talking":
      return animations.TALKING_ANIMATIONS;
    case "dance":
      return animations.ALL_DANCE_ANIMATIONS;
    case "idle":
      return animations.ALL_IDLE_ANIMATIONS;
    case "ai_response":
      return animations.AI_RESPONSE_ANIMATIONS;
    case "all":
      return [
        ...animations.ALL_EXPRESSION_ANIMATIONS,
        ...animations.ALL_DANCE_ANIMATIONS,
        ...animations.ALL_IDLE_ANIMATIONS,
      ];
    default:
      return animations.AI_RESPONSE_ANIMATIONS;
  }
};

// Helper function to get animation name from path
export const getAnimationNameFromPath = (path) => {
  return path.split("/").pop().replace(".glb", "");
};

// Helper function to check if path is a GLB file
export const isGlbFile = (path) => {
  return typeof path === "string" && path.endsWith(".glb");
};

// Helper function to ensure GLB extension
export const ensureGlbExtension = (path) => {
  return isGlbFile(path) ? path : `${path}.glb`;
};

// Commonly used animation names (for easy access in code)
export const ANIMATION_NAMES = {
  // Default idle animations
  DEFAULT_FEMININE_IDLE: "F_Standing_Idle_Variations_002",
  DEFAULT_MASCULINE_IDLE: "M_Standing_Idle_Variations_001",

  // Popular animations
  MASCULINE_IDLE_002: "M_Standing_Idle_Variations_002",
  MASCULINE_IDLE_003: "M_Standing_Idle_Variations_003",

  // Generic idle animations (fallback)
  IDLE_VARIATIONS_001: "Idle_Variations_001",
  IDLE_VARIATIONS_002: "Idle_Variations_002",
  IDLE_VARIATIONS_003: "Idle_Variations_003",

  // Talking animations
  MASCULINE_TALKING_005: "M_Talking_Variations_005",
  MASCULINE_TALKING_006: "M_Talking_Variations_006",
  MASCULINE_TALKING_007: "M_Talking_Variations_007",

  // Expression animations
  MASCULINE_EXPRESSION_001: "M_Standing_Expressions_001",
  MASCULINE_EXPRESSION_002: "M_Standing_Expressions_002",

  // Dance animations
  MASCULINE_DANCE_001: "M_Dances_001",
  MASCULINE_DANCE_002: "M_Dances_002",
};

// Helper function to get path from animation name
export const getPathFromAnimationName = (animationName) => {
  // Search through all animation categories to find the path
  const allAnimations = {
    ...IDLE_ANIMATIONS.FEMININE,
    ...IDLE_ANIMATIONS.MASCULINE,
    ...EXPRESSION_ANIMATIONS.FEMININE,
    ...EXPRESSION_ANIMATIONS.MASCULINE,
    ...DANCE_ANIMATIONS.FEMININE,
    ...DANCE_ANIMATIONS.MASCULINE,
  };

  // Find by exact key match first
  for (const [key, path] of Object.entries(allAnimations)) {
    if (key === animationName) {
      return path;
    }
  }

  // Find by animation name in path
  for (const [key, path] of Object.entries(allAnimations)) {
    if (path.includes(animationName)) {
      return path;
    }
  }

  return null;
};

// Export all as default for convenience
export default {
  MODELS,
  T_POSE,
  IDLE_ANIMATIONS,
  EXPRESSION_ANIMATIONS,
  DANCE_ANIMATIONS,
  ANIMATION_NAMES,
  getAnimationArrays,
  getAnimationsByCategory,
  getAnimationNameFromPath,
  getPathFromAnimationName,
  isGlbFile,
  ensureGlbExtension,
};
