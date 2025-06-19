import { TRAIT_NAME_MAP } from "../../personality/constants/constants";

class VoiceRecognition {
  constructor(onResult, onError, onEnd) {
    this.recognition = null;
    this.isListening = false;
    this.onResult = onResult;
    this.onError = onError;
    this.onEnd = onEnd;
    this.initRecognition();
  }
  initRecognition() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.onResult) {
        this.onResult(transcript);
      }
    };
    this.recognition.onerror = (event) => {
      if (this.onError) {
        this.onError(event.error);
      }
    };
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };
  }
  start() {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) return false;
    }
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      return false;
    }
  }
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
  setLanguage(langCode) {
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }
}

export class VoiceCommandProcessor {
  constructor(dialogHandler, personalityHandler, onRecognitionEnd) {
    this.dialogHandler = dialogHandler;
    this.personalityHandler = personalityHandler;
    this.onRecognitionEnd = onRecognitionEnd;
    this.voiceRecognition = null;
  }
  initialize() {
    this.voiceRecognition = new VoiceRecognition(
      (transcript) => {
        this.processCommand(transcript);
        this.stopListening();
      },
      (error) => {
        if (this.onRecognitionEnd) {
          this.onRecognitionEnd();
        }
      },
      () => {
        if (this.onRecognitionEnd) {
          this.onRecognitionEnd();
        }
      }
    );
  }
  startListening() {
    if (!this.voiceRecognition) {
      this.initialize();
    }
    return this.voiceRecognition.start();
  }
  stopListening() {
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
    }
  }
  processCommand(transcript) {
    const text = transcript.toLowerCase().trim();
    if (this.isPersonalityCommand(text)) {
      return this.handlePersonalityCommand(text);
    }
    if (this.isMessageCommand(text)) {
      return this.handleMessageCommand(text);
    }
    this.dialogHandler(text);
    return { type: "message", content: text };
  }
  isPersonalityCommand(text) {
    const patterns = [
      /increase (my )?(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i,
      /decrease (my )?(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i,
      /set (my )?(openness|conscientiousness|extraversion|agreeableness|neuroticism) to/i,
      /(make|let) me (more|less) (open|conscientious|extraverted|agreeable|neurotic)/i,
    ];
    return patterns.some((pattern) => pattern.test(text));
  }
  isMessageCommand(text) {
    return text.startsWith("send message") || text.startsWith("say");
  }
  handlePersonalityCommand(text) {
    let trait, action, value;
    if (/increase/i.test(text)) {
      action = "increase";
      const match = text.match(
        /(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i
      );
      if (match) trait = match[0].toLowerCase();
    } else if (/decrease/i.test(text)) {
      action = "decrease";
      const match = text.match(
        /(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i
      );
      if (match) trait = match[0].toLowerCase();
    } else if (/set/i.test(text)) {
      action = "set";
      const traitMatch = text.match(
        /(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i
      );
      if (traitMatch) trait = traitMatch[0].toLowerCase();
      const valueMatch = text.match(/to (\d+(\.\d+)?)/i);
      if (valueMatch) value = parseFloat(valueMatch[1]);
    } else if (/(more|less)/i.test(text)) {
      action = /more/i.test(text) ? "increase" : "decrease";
      for (const [key, mappedTrait] of Object.entries(TRAIT_NAME_MAP)) {
        if (text.includes(key)) {
          trait = mappedTrait;
          break;
        }
      }
    }
    if (trait && action) {
      const defaultChange = 0.5;
      this.personalityHandler(trait, action, value || defaultChange);
      return {
        type: "personality",
        trait,
        action,
        value: value || defaultChange,
      };
    }
    return { type: "unknown" };
  }
  handleMessageCommand(text) {
    let messageContent = "";
    if (text.startsWith("send message")) {
      messageContent = text.substring("send message".length).trim();
    } else if (text.startsWith("say")) {
      messageContent = text.substring("say".length).trim();
    }
    if (messageContent) {
      this.dialogHandler(messageContent);
      return { type: "message", content: messageContent };
    }
    return { type: "unknown" };
  }
}

export default VoiceCommandProcessor;
