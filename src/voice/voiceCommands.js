// Voice recognition for commands and messaging
class VoiceRecognition {
  constructor(onResult, onError) {
    this.recognition = null;
    this.isListening = false;
    this.onResult = onResult;
    this.onError = onError;
    this.initRecognition();
  }

  initRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    // Use the appropriate speech recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US'; // Default language
    
    // Set up event handlers
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Voice recognized:', transcript);
      if (this.onResult) {
        this.onResult(transcript);
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
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
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Change the recognition language
  setLanguage(langCode) {
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }
}

// Command parser to handle voice commands
export class VoiceCommandProcessor {
  constructor(dialogHandler, personalityHandler) {
    this.dialogHandler = dialogHandler;
    this.personalityHandler = personalityHandler;
    this.voiceRecognition = null;
  }

  initialize() {
    this.voiceRecognition = new VoiceRecognition(
      (transcript) => this.processCommand(transcript),
      (error) => console.error('Voice recognition error:', error)
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
    // Convert to lowercase for easier matching
    const text = transcript.toLowerCase().trim();
    
    // Check for personality adjustment commands
    if (this.isPersonalityCommand(text)) {
      return this.handlePersonalityCommand(text);
    }
    
    // Check for message commands
    if (this.isMessageCommand(text)) {
      return this.handleMessageCommand(text);
    }
    
    // If no specific command pattern is detected, treat as a regular message
    this.dialogHandler(text);
    return { type: 'message', content: text };
  }

  isPersonalityCommand(text) {
    const patterns = [
      /increase (my )?(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i,
      /decrease (my )?(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i,
      /set (my )?(openness|conscientiousness|extraversion|agreeableness|neuroticism) to/i,
      /(make|let) me (more|less) (open|conscientious|extraverted|agreeable|neurotic)/i
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  isMessageCommand(text) {
    return text.startsWith('send message') || text.startsWith('say');
  }

  handlePersonalityCommand(text) {
    // Extract trait and action from command
    let trait, action, value;
    
    if (/increase/i.test(text)) {
      action = 'increase';
      // Extract the trait name
      const match = text.match(/(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i);
      if (match) trait = match[0].toLowerCase();
    } else if (/decrease/i.test(text)) {
      action = 'decrease';
      const match = text.match(/(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i);
      if (match) trait = match[0].toLowerCase();
    } else if (/set/i.test(text)) {
      action = 'set';
      const traitMatch = text.match(/(openness|conscientiousness|extraversion|agreeableness|neuroticism)/i);
      if (traitMatch) trait = traitMatch[0].toLowerCase();
      
      // Try to extract a numeric value
      const valueMatch = text.match(/to (\d+(\.\d+)?)/i);
      if (valueMatch) value = parseFloat(valueMatch[1]);
    } else if (/(more|less)/i.test(text)) {
      action = /more/i.test(text) ? 'increase' : 'decrease';
      
      // Map simplified trait terms to actual traits
      const traitMap = {
        'open': 'openness',
        'conscientious': 'conscientiousness',
        'extraverted': 'extraversion',
        'agreeable': 'agreeableness',
        'neurotic': 'neuroticism'
      };
      
      for (const [key, mappedTrait] of Object.entries(traitMap)) {
        if (text.includes(key)) {
          trait = mappedTrait;
          break;
        }
      }
    }
    
    // If we identified a trait and action, update the personality
    if (trait && action) {
      // Default increment/decrement amount
      const defaultChange = 0.5;
      
      if (action === 'increase') {
        this.personalityHandler(trait, 'increase', value || defaultChange);
      } else if (action === 'decrease') {
        this.personalityHandler(trait, 'decrease', value || defaultChange);
      } else if (action === 'set' && value !== undefined) {
        this.personalityHandler(trait, 'set', value);
      }
      
      return { 
        type: 'personality', 
        trait, 
        action, 
        value: value || defaultChange 
      };
    }
    
    return { type: 'unknown' };
  }

  handleMessageCommand(text) {
    // Extract the actual message content
    let messageContent = '';
    
    if (text.startsWith('send message')) {
      messageContent = text.substring('send message'.length).trim();
    } else if (text.startsWith('say')) {
      messageContent = text.substring('say'.length).trim();
    }
    
    if (messageContent) {
      this.dialogHandler(messageContent);
      return { type: 'message', content: messageContent };
    }
    
    return { type: 'unknown' };
  }
}

export default VoiceCommandProcessor;