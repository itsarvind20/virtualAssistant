export const speechConfig = {
  provider: import.meta.env.VITE_SPEECH_PROVIDER || "auto",
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

export const isVoskConfigured = () => Boolean(speechConfig.voskModelPath);
