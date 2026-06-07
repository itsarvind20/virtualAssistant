export const speechConfig = {
  provider: import.meta.env.VITE_SPEECH_PROVIDER || "auto",
  wakeWordProvider: import.meta.env.VITE_WAKE_WORD_PROVIDER || "browser",
  recognitionLanguage: import.meta.env.VITE_SPEECH_RECOGNITION_LANG || "en-IN",
  responseLanguage: import.meta.env.VITE_ASSISTANT_RESPONSE_LANG || "en",
  ttsLanguage: import.meta.env.VITE_TTS_LANG || import.meta.env.VITE_SPEECH_RECOGNITION_LANG || "en-IN",
  picovoiceAccessKey: import.meta.env.VITE_PICOVOICE_ACCESS_KEY || "",
  porcupineKeywordPath: import.meta.env.VITE_PORCUPINE_KEYWORD_PATH || "",
  porcupineModelPath: import.meta.env.VITE_PORCUPINE_MODEL_PATH || "/porcupine_params.pv",
  porcupineSensitivity: Number(import.meta.env.VITE_PORCUPINE_SENSITIVITY || 0.65),
  voskModelPath: import.meta.env.VITE_VOSK_MODEL_PATH || "",
};

export const getSpeechProviderLabel = () => {
  if (speechConfig.provider === "offline") return "offline";
  if (speechConfig.provider === "browser") return "browser";
  return "auto";
};

export const isPorcupineConfigured = () =>
  Boolean(speechConfig.picovoiceAccessKey && speechConfig.porcupineKeywordPath);

export const shouldUsePorcupineWakeWord = () =>
  speechConfig.wakeWordProvider === "porcupine" && isPorcupineConfigured();

export const isVoskConfigured = () => Boolean(speechConfig.voskModelPath);

export const shouldPreferBrowserSpeechRecognition = () =>
  speechConfig.provider === "browser" ||
  (
    speechConfig.provider === "auto" &&
    !speechConfig.recognitionLanguage.toLowerCase().startsWith("en")
  );

export const getAssistantResponseLanguageLabel = () => {
  const language = speechConfig.responseLanguage.toLowerCase();

  if (language.startsWith("hi")) return "Hindi";
  if (language.startsWith("hinglish")) return "Hinglish";
  return "English";
};
