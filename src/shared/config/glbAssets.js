/**
 * Centralized GLB Assets Configuration
 * This file contains all GLB file paths used throughout the application
 * to avoid hardcoded paths scattered across the codebase.
 */

export const MODELS = {
  BASE: "/assets/models/base.glb",
};

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

export const getAnimationArrays = () => ({
  DEFAULT_ANIMATIONS: [
    ...Object.values(IDLE_ANIMATIONS.MASCULINE),
    ...Object.values(IDLE_ANIMATIONS.FEMININE),

    ...Object.values(EXPRESSION_ANIMATIONS.MASCULINE),
    ...Object.values(EXPRESSION_ANIMATIONS.FEMININE),
  ],

  AI_RESPONSE_ANIMATIONS: [
    ...Object.values(EXPRESSION_ANIMATIONS.MASCULINE).filter((path) => path.includes("Talking")),
    ...Object.values(EXPRESSION_ANIMATIONS.FEMININE).filter((path) => path.includes("Talking")),
  ],

  TALKING_ANIMATIONS: [
    ...Object.values(EXPRESSION_ANIMATIONS.MASCULINE).filter((path) => path.includes("Talking")),
    ...Object.values(EXPRESSION_ANIMATIONS.FEMININE).filter((path) => path.includes("Talking")),
  ],

  PURE_EXPRESSION_ANIMATIONS: [
    ...Object.values(EXPRESSION_ANIMATIONS.FEMININE).filter((path) => !path.includes("Talking")),
    ...Object.values(EXPRESSION_ANIMATIONS.MASCULINE).filter((path) => !path.includes("Talking")),
  ],

  ALL_EXPRESSION_ANIMATIONS: [
    ...Object.values(EXPRESSION_ANIMATIONS.FEMININE),
    ...Object.values(EXPRESSION_ANIMATIONS.MASCULINE),
  ],

  ALL_IDLE_ANIMATIONS: [
    ...Object.values(IDLE_ANIMATIONS.FEMININE),
    ...Object.values(IDLE_ANIMATIONS.MASCULINE),
  ],
});

export const getAnimationsByCategory = (category) => {
  const animations = getAnimationArrays();

  switch (category) {
    case "expression":
      return animations.PURE_EXPRESSION_ANIMATIONS;
    case "talking":
      return animations.TALKING_ANIMATIONS;
    case "idle":
      return animations.ALL_IDLE_ANIMATIONS;
    case "ai_response":
      return animations.AI_RESPONSE_ANIMATIONS;
    case "all":
      return [...animations.ALL_IDLE_ANIMATIONS, ...animations.TALKING_ANIMATIONS];
    default:
      return animations.AI_RESPONSE_ANIMATIONS;
  }
};

export const getAnimationNameFromPath = (path) => {
  return path.split("/").pop().replace(".glb", "");
};

export const isGlbFile = (path) => {
  return typeof path === "string" && path.endsWith(".glb");
};

export const ANIMATION_NAMES = {
  DEFAULT_FEMININE_IDLE: "F_Standing_Idle_Variations_002",
};

const glbAssets = {
  MODELS,
  IDLE_ANIMATIONS,
  EXPRESSION_ANIMATIONS,
  ANIMATION_NAMES,
  getAnimationArrays,
  getAnimationsByCategory,
  getAnimationNameFromPath,
  isGlbFile,
};

export default glbAssets;
