export const DEFAULT_VOICE_CONFIG = {
  languageCode: "en-US",
  name: "en-US-Wavenet-D",
  ssmlGender: "NEUTRAL",
  speakingRate: 1.0,
  pitch: 0.0,
};

export const getLanguageOptions = (t) => [
  { code: "en-US", label: t("voice.languages.englishUS"), flag: "🇺🇸" },
  { code: "es-ES", label: t("voice.languages.spanishSpain"), flag: "🇪🇸" },
];

export const VOICE_OPTIONS = {
  "en-US": [
    { name: "en-US-Wavenet-A", label: "Wavenet A", gender: "Female" },
    { name: "en-US-Wavenet-B", label: "Wavenet B", gender: "Male" },
    { name: "en-US-Wavenet-C", label: "Wavenet C", gender: "Female" },
    { name: "en-US-Wavenet-D", label: "Wavenet D", gender: "Male" },
    { name: "en-US-Wavenet-E", label: "Wavenet E", gender: "Female" },
    { name: "en-US-Wavenet-F", label: "Wavenet F", gender: "Female" },
    { name: "en-US-Wavenet-G", label: "Wavenet G", gender: "Female" },
    { name: "en-US-Wavenet-H", label: "Wavenet H", gender: "Female" },
    { name: "en-US-Wavenet-I", label: "Wavenet I", gender: "Male" },
    { name: "en-US-Wavenet-J", label: "Wavenet J", gender: "Male" },
  ],
  "es-ES": [
    { name: "es-ES-Wavenet-A", label: "Wavenet A", gender: "Female" },
    { name: "es-ES-Wavenet-B", label: "Wavenet B", gender: "Male" },
    { name: "es-ES-Wavenet-C", label: "Wavenet C", gender: "Female" },
    { name: "es-ES-Wavenet-D", label: "Wavenet D", gender: "Female" },
  ],
};

export const getSsmlGenderOptions = (t) => [
  { value: "NEUTRAL", label: t("voice.genderOptions.neutral"), icon: "N" },
  { value: "MALE", label: t("voice.genderOptions.male"), icon: "M" },
  { value: "FEMALE", label: t("voice.genderOptions.female"), icon: "F" },
];

export const getVoiceParameters = (t) => ({
  speakingRate: {
    min: 0.25,
    max: 4.0,
    default: 1.0,
    step: 0.1,
    label: t("voice.parameterLabels.speakingRateLabel"),
    description: t("voice.parameterDescriptions.speakingRateDesc"),
    unit: "x",
  },
  pitch: {
    min: -20.0,
    max: 20.0,
    default: 0.0,
    step: 0.5,
    label: t("voice.parameterLabels.pitchLabel"),
    description: t("voice.parameterDescriptions.pitchDesc"),
    unit: " semitones",
  },
});

// Legacy constants for backward compatibility - these will be deprecated
export const LANGUAGE_OPTIONS = [
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "es-ES", label: "Spanish (Spain)", flag: "🇪🇸" },
];

export const SSML_GENDER_OPTIONS = [
  { value: "NEUTRAL", label: "Neutral", icon: "N" },
  { value: "MALE", label: "Male", icon: "M" },
  { value: "FEMALE", label: "Female", icon: "F" },
];

export const VOICE_PARAMETERS = {
  speakingRate: {
    min: 0.25,
    max: 4.0,
    default: 1.0,
    step: 0.1,
    label: "Speaking Rate",
    description: "Controls the speed of speech",
    unit: "x",
  },
  pitch: {
    min: -20.0,
    max: 20.0,
    default: 0.0,
    step: 0.5,
    label: "Pitch",
    description: "Controls the pitch of the voice",
    unit: " semitones",
  },
};
