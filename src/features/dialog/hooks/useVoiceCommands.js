import { useCallback, useEffect, useState } from "react";
import VoiceCommandProcessor from "../../voice/services/voiceCommands";
import { TYPING_EVENTS } from "../constants/constants";

const useVoiceCommands = (sendMessage, updateTrait, traits) => {
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [commandProcessor, setCommandProcessor] = useState(null);

  useEffect(() => {
    if (!commandProcessor) {
      const handleDialog = (text) => {
        sendMessage(text);
      };

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

          setTimeout(() => {
            setStatusMessage("");
          }, 2000);
        }
      };

      const handleRecognitionEnd = () => {
        setIsListening(false);
        setStatusMessage("Voice recognition complete");

        document.dispatchEvent(new CustomEvent(TYPING_EVENTS.STOP));

        setTimeout(() => {
          setStatusMessage("");
        }, 2000);
      };

      const processor = new VoiceCommandProcessor(
        handleDialog,
        handlePersonality,
        handleRecognitionEnd,
      );
      setCommandProcessor(processor);
    }
  }, [commandProcessor, sendMessage, updateTrait, traits]);

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      commandProcessor.stopListening();
      setStatusMessage("Voice recognition stopped");
      setIsListening(false);

      document.dispatchEvent(new CustomEvent(TYPING_EVENTS.STOP));

      setTimeout(() => {
        setStatusMessage("");
      }, 2000);
    } else {
      const started = commandProcessor.startListening();
      if (started) {
        setStatusMessage("Listening...");
        setIsListening(true);

        document.dispatchEvent(new CustomEvent(TYPING_EVENTS.START));
      } else {
        setStatusMessage("Failed to start voice recognition");

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
