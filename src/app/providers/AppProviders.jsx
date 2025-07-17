import React from "react";
import { PersonalityProvider } from "../../features/personality";
import { DialogProvider } from "../../features/dialog";
import { AvatarAnimationProvider } from "../../features/avatar/context/AvatarAnimationContext";
import { TTSProvider, RealTimeConversationProvider } from "../../features/voice";

export const AppProviders = ({ children }) => {
  return (
    <PersonalityProvider>
      <AvatarAnimationProvider>
        <TTSProvider>
          <DialogProvider>
            <RealTimeConversationProvider>{children}</RealTimeConversationProvider>
          </DialogProvider>
        </TTSProvider>
      </AvatarAnimationProvider>
    </PersonalityProvider>
  );
};

export default AppProviders;
