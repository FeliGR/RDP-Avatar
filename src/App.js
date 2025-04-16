import React, { useState } from "react";
import "./App.css";
import AvatarViewer from "./components/AvatarViewer";
import DialogBox from "./components/DialogBox";
import PersonalityControls from "./components/PersonalityControls";
import { DialogProvider, useDialog } from "./context/DialogContext";
import {
  PersonalityProvider,
  usePersonality,
} from "./context/PersonalityContext";
import VoiceCommandProcessor from "./voice/voiceCommands";

// Voice command component
const VoiceCommandButton = () => {
  const [isListening, setIsListening] = useState(false);
  const { sendUserMessage } = useDialog();
  const { updateTrait, personalityTraits } = usePersonality();
  const [commandProcessor, setCommandProcessor] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Initialize voice command processor if not yet done
  React.useEffect(() => {
    if (!commandProcessor) {
      const handleDialog = (text) => {
        sendUserMessage(text);
      };

      const handlePersonality = (trait, action, value) => {
        let newValue;
        const currentValue = personalityTraits[trait];

        if (action === "increase") {
          newValue = Math.min(5.0, currentValue + value);
        } else if (action === "decrease") {
          newValue = Math.max(1.0, currentValue - value);
        } else if (action === "set") {
          newValue = Math.max(1.0, Math.min(5.0, value));
        }

        if (newValue !== undefined) {
          updateTrait(trait, newValue);
          setStatusMessage(`Updated ${trait} to ${newValue.toFixed(1)}`);
        }
      };

      const processor = new VoiceCommandProcessor(
        handleDialog,
        handlePersonality
      );
      setCommandProcessor(processor);
    }
  }, [commandProcessor, sendUserMessage, updateTrait, personalityTraits]);

  const toggleListening = () => {
    if (isListening) {
      commandProcessor.stopListening();
      setStatusMessage("Voice recognition stopped");
    } else {
      const started = commandProcessor.startListening();
      if (started) {
        setStatusMessage("Listening...");
      } else {
        setStatusMessage("Failed to start voice recognition");
      }
    }
    setIsListening(!isListening);
  };

  return (
    <div className="voice-command-container">
      <button
        onClick={toggleListening}
        className={`voice-button ${isListening ? "listening" : ""}`}
        aria-label={
          isListening ? "Stop voice recognition" : "Start voice recognition"
        }
      >
        {isListening ? "Stop" : "Voice"}
      </button>
      {statusMessage && <div className="status-message">{statusMessage}</div>}
    </div>
  );
};

function AppContent() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Persona Dynamics AI</h1>
        <p className="app-description">
          Experience next-generation digital identity with AI-powered avatar personalization. Our advanced platform enables seamless voice and text interactions while dynamically adapting to your unique personality traits.
        </p>
      </header>

      <main className="app-content">
        <div className="avatar-section">
          <div className="app-card">
            <div className="app-card-header">
              <h2>Avatar</h2>
            </div>
            <div className="app-card-content">
              <AvatarViewer />
            </div>
          </div>
        </div>

        <div className="interaction-section">
          <div className="app-card">
            <div className="app-card-header">
              <h2>Personality Profile</h2>
            </div>
            <div className="app-card-content">
              <PersonalityControls />
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-header">
              <h2>Conversation</h2>
            </div>
            <div className="app-card-content">
              <DialogBox />
            </div>
          </div>
        </div>

        <VoiceCommandButton />
      </main>
    </div>
  );
}

function App() {
  return (
    <PersonalityProvider>
      <DialogProvider>
        <AppContent />
      </DialogProvider>
    </PersonalityProvider>
  );
}

export default App;
