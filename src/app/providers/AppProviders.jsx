import React from "react";
import { PersonalityProvider } from "../../features/personality";
import { DialogProvider } from "../../features/dialog";
import { AvatarAnimationProvider } from "../../features/avatar/context/AvatarAnimationContext";

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
