import React from "react";
import { PersonalityProvider } from "../../features/personality";
import { DialogProvider } from "../../features/dialog";
import { AvatarAnimationProvider } from "../../features/avatar/context/AvatarAnimationContext";

/**
 * Main app provider that wraps all feature providers
 * This ensures proper context hierarchy and dependency management
 */
export const AppProviders = ({ children }) => {
  return (
    <PersonalityProvider>
      <AvatarAnimationProvider>
        <DialogProvider>{children}</DialogProvider>
      </AvatarAnimationProvider>
    </PersonalityProvider>
  );
};

export default AppProviders;
