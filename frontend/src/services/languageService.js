import { speechConfig } from "./speechConfig";

const LANGUAGE_OPTIONS = [
  {
    code: "hi-IN",
    responseLanguage: "hi",
    label: "Hindi",
    script: /[\u0900-\u097F]/,
    words: /\b(hindi|namaste|kaise|kya|mujhe|mera|meri|mere|karo|khol|kholo|chalao|batao|ruk|roko|band|gaana|gana|samay|tarikh|aaj|kal)\b/i,
  },
  {
    code: "mr-IN",
    responseLanguage: "mr",
    label: "Marathi",
    script: /[\u0900-\u097F]/,
    words: /\b(marathi|namaskar|kay|majha|majhi|ughada|sanga|thamb|gaane)\b/i,
  },
  {
    code: "bn-IN",
    responseLanguage: "bn",
    label: "Bengali",
    script: /[\u0980-\u09FF]/,
    words: /\b(bengali|bangla|bolo|koro|gaan)\b/i,
  },
  {
    code: "ta-IN",
    responseLanguage: "ta",
    label: "Tamil",
    script: /[\u0B80-\u0BFF]/,
    words: /\b(tamil|vanakkam|enna|paatu)\b/i,
  },
  {
    code: "te-IN",
    responseLanguage: "te",
    label: "Telugu",
    script: /[\u0C00-\u0C7F]/,
    words: /\b(telugu|namaskaram|enti|paata)\b/i,
  },
  {
    code: "gu-IN",
    responseLanguage: "gu",
    label: "Gujarati",
    script: /[\u0A80-\u0AFF]/,
    words: /\b(gujarati|kem cho|shu|gaana)\b/i,
  },
  {
    code: "kn-IN",
    responseLanguage: "kn",
    label: "Kannada",
    script: /[\u0C80-\u0CFF]/,
    words: /\b(kannada|namaskara|enu|haadu)\b/i,
  },
  {
    code: "ml-IN",
    responseLanguage: "ml",
    label: "Malayalam",
    script: /[\u0D00-\u0D7F]/,
    words: /\b(malayalam|namaskaram|entha|paattu)\b/i,
  },
  {
    code: "es-ES",
    responseLanguage: "es",
    label: "Spanish",
    words: /\b(hola|gracias|buscar|abre|abrir|reproduce|cancion|musica|tiempo|fecha)\b/i,
  },
  {
    code: "fr-FR",
    responseLanguage: "fr",
    label: "French",
    words: /\b(bonjour|merci|chercher|ouvre|ouvrir|joue|musique|heure|date)\b/i,
  },
];

const byCode = (language = "") =>
  LANGUAGE_OPTIONS.find((option) =>
    language.toLowerCase().startsWith(option.responseLanguage.toLowerCase())
  );

export const detectCommandLanguage = (text = "", fallback = speechConfig.ttsLanguage) => {
  const command = String(text || "");
  const configured = byCode(fallback);
  const detected =
    LANGUAGE_OPTIONS.find((option) => option.script?.test(command)) ||
    LANGUAGE_OPTIONS.find((option) => option.words?.test(command)) ||
    configured ||
    {
      code: fallback || "en-IN",
      responseLanguage: (fallback || "en").split("-")[0],
      label: "English",
    };

  return {
    code: detected.code,
    responseLanguage: detected.responseLanguage,
    label: detected.label,
  };
};

export const getLanguageInstruction = (language) => {
  if (!language?.label) return "Respond in the same language as the user.";

  return `Respond in ${language.label}. If the user mixes languages, respond in the same mixed style.`;
};
