/**
 * Global application configuration
 * Centralized place for app-wide constants and settings
 */

// App metadata
export const APP_CONFIG = {
  name: 'Persona Dynamics AI',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  description: 'Experience next-generation digital identity with AI-powered avatar personalization',
};

// Environment configuration
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Feature flags
export const FEATURE_FLAGS = {
  enableVoiceCommands: true,
  enableAdvancedPersonality: true,
  enableARFeatures: false, // Future feature
};

// UI Configuration
export const UI_CONFIG = {
  theme: {
    primary: 'rgb(33, 150, 243)',
    primaryDark: 'rgb(25, 118, 210)',
    primaryLight: 'rgb(100, 181, 246)',
  },
  breakpoints: {
    mobile: '768px',
    tablet: '992px',
    desktop: '1200px',
    large: '1400px',
  },
};

export default {
  APP_CONFIG,
  ENV_CONFIG,
  FEATURE_FLAGS,
  UI_CONFIG,
};
