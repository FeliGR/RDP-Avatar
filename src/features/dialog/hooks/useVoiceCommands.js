import { useCallback, useEffect, useState } from "react";
import VoiceCommandProcessor from "../../voice/services/voiceCommands";
import { TYPING_EVENTS } from "../constants/constants";

/**
 * A hook for voice command processing functionality
 * @param {Function} sendMessage - Function to send dialog messages
 * @param {Function} updateTrait - Function to update personality traits
 * @param {Object} traits - Current personality traits
 */
const useVoiceCommands = (sendMessage, updateTrait, traits) => {
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [commandProcessor, setCommandProcessor] = useState(null);

  // Initialize voice command processor
  useEffect(() => {
    if (!commandProcessor) {
      // Handle dialog command
      const handleDialog = (text) => {
        sendMessage(text);
      };

      // Handle personality trait command
      const handlePersonality = (trait, action, value) => {
        let newValue;
        const currentValue = traits[trait];

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

          // Clear status message after 2 seconds
          setTimeout(() => {
            setStatusMessage("");
          }, 2000);
        }
      };

      // Handle recognition end
      const handleRecognitionEnd = () => {
        setIsListening(false);
        setStatusMessage("Voice recognition complete");

        // Dispatch typing stop event
        document.dispatchEvent(new CustomEvent(TYPING_EVENTS.STOP));

        // Clear status message after 2 seconds
        setTimeout(() => {
          setStatusMessage("");
        }, 2000);
      };

      const processor = new VoiceCommandProcessor(
        handleDialog,
        handlePersonality,
        handleRecognitionEnd
      );
      setCommandProcessor(processor);
    }
  }, [commandProcessor, sendMessage, updateTrait, traits]);

  // Toggle voice input functionality
  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      commandProcessor.stopListening();
      setStatusMessage("Voice recognition stopped");
      setIsListening(false);

      // Dispatch typing stop event
      document.dispatchEvent(new CustomEvent(TYPING_EVENTS.STOP));

      // Clear status message after 2 seconds
      setTimeout(() => {
        setStatusMessage("");
      }, 2000);
    } else {
      const started = commandProcessor.startListening();
      if (started) {
        setStatusMessage("Listening...");
        setIsListening(true);

        // Dispatch typing start event since voice is active
        document.dispatchEvent(new CustomEvent(TYPING_EVENTS.START));
      } else {
        setStatusMessage("Failed to start voice recognition");

        // Clear error message after 2 seconds
        setTimeout(() => {
          setStatusMessage("");
        }, 2000);
      }
    }
  }, [isListening, commandProcessor]);

  return {
    isListening,
    statusMessage,
    toggleVoiceInput,
  };
};

export default useVoiceCommands;
