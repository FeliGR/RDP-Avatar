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

// These will now be loaded from i18n translations
export const getTraitDescriptions = (t) => ({
  openness: t('personality.descriptions.openness'),
  conscientiousness: t('personality.descriptions.conscientiousness'),
  extraversion: t('personality.descriptions.extraversion'),
  agreeableness: t('personality.descriptions.agreeableness'),
  neuroticism: t('personality.descriptions.neuroticism'),
});

export const getDetailedTraitDescriptions = (t) => ({
  openness: {
    title: t('personality.detailed.openness.title'),
    description: t('personality.detailed.openness.description'),
    effects: t('personality.detailed.openness.effects'),
    highExample: t('personality.detailed.openness.highExample'),
    lowExample: t('personality.detailed.openness.lowExample'),
    icon: t('personality.detailed.openness.icon'),
  },
  conscientiousness: {
    title: t('personality.detailed.conscientiousness.title'),
    description: t('personality.detailed.conscientiousness.description'),
    effects: t('personality.detailed.conscientiousness.effects'),
    highExample: t('personality.detailed.conscientiousness.highExample'),
    lowExample: t('personality.detailed.conscientiousness.lowExample'),
    icon: t('personality.detailed.conscientiousness.icon'),
  },
  extraversion: {
    title: t('personality.detailed.extraversion.title'),
    description: t('personality.detailed.extraversion.description'),
    effects: t('personality.detailed.extraversion.effects'),
    highExample: t('personality.detailed.extraversion.highExample'),
    lowExample: t('personality.detailed.extraversion.lowExample'),
    icon: t('personality.detailed.extraversion.icon'),
  },
  agreeableness: {
    title: t('personality.detailed.agreeableness.title'),
    description: t('personality.detailed.agreeableness.description'),
    effects: t('personality.detailed.agreeableness.effects'),
    highExample: t('personality.detailed.agreeableness.highExample'),
    lowExample: t('personality.detailed.agreeableness.lowExample'),
    icon: t('personality.detailed.agreeableness.icon'),
  },
  neuroticism: {
    title: t('personality.detailed.neuroticism.title'),
    description: t('personality.detailed.neuroticism.description'),
    effects: t('personality.detailed.neuroticism.effects'),
    highExample: t('personality.detailed.neuroticism.highExample'),
    lowExample: t('personality.detailed.neuroticism.lowExample'),
    icon: t('personality.detailed.neuroticism.icon'),
  },
});

export const TRAIT_NAME_MAP = {
  open: "openness",
  conscientious: "conscientiousness",
  extraverted: "extraversion",
  agreeable: "agreeableness",
  neurotic: "neuroticism",
};
