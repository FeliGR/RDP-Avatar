// Personality feature barrel exports
export { default as PersonalityControls } from './PersonalityControls';
export { PersonalityProvider, usePersonality } from './context/PersonalityContext';

// Components
export { default as TraitSlider } from './components/TraitSlider';
export { default as TraitInfoModal } from './components/TraitInfoModal';
export { default as ErrorMessage } from './components/ErrorMessage';

// Hooks
export { default as useDebounce } from './hooks/useDebounce';
export { default as useLocalTraits } from './hooks/useLocalTraits';

// Constants
export * from './constants/constants';
