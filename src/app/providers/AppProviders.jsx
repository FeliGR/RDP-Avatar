import React from "react";
import { PersonalityProvider } from "../../features/personality";
import { DialogProvider } from "../../features/dialog";
import { AvatarAnimationProvider } from "../../features/avatar/context/AvatarAnimationContext";
import {
  TTSProvider,
  RealTimeConversationProvider,
  VoiceConfigProvider,
} from "../../features/voice";

export const AppProviders = ({ children }) => {
  return (
    <PersonalityProvider>
      <AvatarAnimationProvider>
        <VoiceConfigProvider>
          <TTSProvider>
            <DialogProvider>
              <RealTimeConversationProvider>{children}</RealTimeConversationProvider>
            </DialogProvider>
          </TTSProvider>
        </VoiceConfigProvider>
      </AvatarAnimationProvider>
    </PersonalityProvider>
  );
};

export default AppProviders;
