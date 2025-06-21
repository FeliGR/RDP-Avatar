export const DEFAULT_PERSONALITY = {
  openness: 3.0,
  conscientiousness: 3.0,
  extraversion: 3.0,
  agreeableness: 3.0,
  neuroticism: 3.0,
  userId: 1,
};

export const BIG_FIVE_TRAITS = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
];

export const TRAIT_DESCRIPTIONS = {
  openness: "Curiosity and openness to new experiences",
  conscientiousness: "Organized and focused on goals",
  extraversion: "Social and outgoing nature",
  agreeableness: "Friendly and cooperative attitude",
  neuroticism: "Emotional stability and reactions to stress",
};

export const DETAILED_TRAIT_DESCRIPTIONS = {
  openness: {
    title: "Openness to Experience",
    description: "Reflects curiosity, creativity, and preference for novelty and variety.",
    effects:
      "Higher openness values make the AI more creative, explorative, and open to discussing abstract concepts and new ideas. Lower values result in more conventional, practical responses focused on established facts.",
    highExample:
      "That's an interesting perspective! Let's explore different angles and possibilities...",
    lowExample: "I prefer to stick with proven, practical approaches that work reliably...",
    icon: "🔍",
  },
  conscientiousness: {
    title: "Conscientiousness",
    description: "Reflects organization, responsibility, and goal-directed behavior.",
    effects:
      "Higher conscientiousness values make the AI more methodical, detail-oriented, and focused on planning and organization. Lower values result in more spontaneous, flexible responses with less structure.",
    highExample:
      "I'll outline a structured plan with specific steps to achieve your goal efficiently...",
    lowExample: "Let's take a more flexible approach and see where it leads us...",
    icon: "✓",
  },
  extraversion: {
    title: "Extraversion",
    description: "Reflects sociability, assertiveness, and emotional expressiveness.",
    effects:
      "Higher extraversion values make the AI more enthusiastic, talkative, and socially engaged. Lower values result in more reserved, thoughtful responses that are less emotionally expressive.",
    highExample:
      "I'm excited to work with you on this project! Let's collaborate and share ideas!",
    lowExample: "I've given this careful thought and would suggest a measured approach...",
    icon: "👥",
  },
  agreeableness: {
    title: "Agreeableness",
    description: "Reflects cooperation, compassion, and consideration for others.",
    effects:
      "Higher agreeableness values make the AI more empathetic, supportive, and focused on creating harmony. Lower values result in more direct, challenging responses that prioritize honesty over tact.",
    highExample:
      "I understand how you feel, and I'm here to support you in finding a solution...",
    lowExample:
      "To be direct, there are several issues with this approach that need addressing...",
    icon: "🤝",
  },
  neuroticism: {
    title: "Emotional Sensitivity",
    description: "Reflects emotional reactivity and sensitivity to stressors.",
    effects:
      "Higher sensitivity values make the AI more emotionally nuanced, cautious, and attentive to potential problems. Lower values result in more emotionally stable, optimistic responses with less focus on risks.",
    highExample:
      "I'm concerned about potential challenges we might face with this approach...",
    lowExample: "I'm confident we can handle any challenges that come up along the way...",
    icon: "🧠",
  },
};

export const TRAIT_NAME_MAP = {
  open: "openness",
  conscientious: "conscientiousness",
  extraverted: "extraversion",
  agreeable: "agreeableness",
  neurotic: "neuroticism",
};
