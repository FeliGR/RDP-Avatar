// Main avatar components
export { default as AvatarViewer } from "./components/AvatarViewer";
export { default as ReadyPlayerMeAvatar } from "./components/ReadyPlayerMeAvatar";

// Animation hooks
export { useAvatarAnimations } from "./hooks/useAvatarAnimations";
export { useAIResponseAnimations } from "./hooks/useAIResponseAnimations";
export { useOfficeEnvironment } from "./hooks/useOfficeEnvironment";

// Context providers
export { AvatarAnimationProvider, useAvatarAnimation } from "./context/AvatarAnimationContext";
