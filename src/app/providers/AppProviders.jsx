// App providers - centralized context providers
import React from "react";
import { PersonalityProvider } from "../../features/personality";
import { DialogProvider } from "../../features/dialog";

/**
 * Main app provider that wraps all feature providers
 * This ensures proper context hierarchy and dependency management
 */
export const AppProviders = ({ children }) => {
  return (
    <PersonalityProvider>
      <DialogProvider>{children}</DialogProvider>
    </PersonalityProvider>
  );
};

export default AppProviders;
