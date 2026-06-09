import { getBrowserSpeechRecognition, normalizeSpeechText } from "../utils/audioHelpers";
import { isVoskConfigured, shouldPreferBrowserSpeechRecognition, speechConfig } from "./speechConfig";
import { createVoskSpeechRecognitionService } from "./voskSpeechService";

export const createSpeechRecognitionService = ({
  lang = speechConfig.recognitionLanguage,
  continuous = true,
  interimResults = true,
  maxAlternatives = 3,
  onResult,
  onInterim,
  onStart,
  onEnd,
  onError,
} = {}) => {
  const SpeechRecognition = getBrowserSpeechRecognition();

  if (!SpeechRecognition) {
    throw new Error("Speech recognition is not supported in this browser.");
  }

  const recognition = new SpeechRecognition();
  let active = false;
  let starting = false;
  let disposed = false;

  recognition.lang = lang;
  recognition.continuous = continuous;
  recognition.interimResults = interimResults;
  recognition.maxAlternatives = maxAlternatives;

  recognition.onstart = () => {
    starting = false;
    active = true;
    onStart?.();
  };

  recognition.onend = () => {
    starting = false;
    active = false;
    onEnd?.();
  };

  recognition.onerror = (event) => {
    starting = false;
    active = false;
    onError?.(event);
  };

  recognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const alternatives = Array.from(result);
      const bestAlternative = alternatives.reduce(
        (best, current) =>
          (current.confidence || 0) > (best.confidence || 0) ? current : best,
        alternatives[0]
      );
      const transcript = bestAlternative?.transcript || "";

      if (result.isFinal) {
        finalText += ` ${transcript}`;
      } else {
        interimText += ` ${transcript}`;
      }
    }

    if (interimText.trim()) {
      onInterim?.(normalizeSpeechText(interimText));
    }

    if (finalText.trim()) {
      onResult?.(normalizeSpeechText(finalText));
    }
  };

  const start = () => {
    if (disposed || active || starting) return;

    try {
      starting = true;
      recognition.start();
    } catch (error) {
      const alreadyStarted =
        error?.name === "InvalidStateError" ||
        String(error.message || "").toLowerCase().includes("already started");

      if (alreadyStarted) {
        starting = false;
        active = true;
        return;
      }

      starting = false;
      active = false;
      if (!alreadyStarted) {
        onError?.(error);
      }
    }
  };

  const stop = () => {
    if (disposed || (!active && !starting)) return;

    try {
      recognition.stop();
    } catch {
      starting = false;
      active = false;
    }
  };

  const abort = () => {
    if (disposed) return;

    try {
      recognition.abort();
    } catch {
      starting = false;
      active = false;
    }
  };

  const dispose = () => {
    disposed = true;
    abort();
    recognition.onstart = null;
    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
  };

  return {
    start,
    stop,
    abort,
    dispose,
    isActive: () => active,
    isStarting: () => starting,
    provider: "browser",
  };
};

export const createBestSpeechRecognitionService = async (options = {}) => {
  if (shouldPreferBrowserSpeechRecognition()) {
    return createSpeechRecognitionService({
      ...options,
      lang: options.lang || speechConfig.recognitionLanguage,
    });
  }

  const wantsVosk = speechConfig.provider === "offline" || speechConfig.provider === "auto";

  if (wantsVosk && isVoskConfigured()) {
    try {
      return await createVoskSpeechRecognitionService(options);
    } catch (error) {
      options.onError?.(error);

      if (speechConfig.provider === "offline") {
        throw error;
      }
    }
  }

  return createSpeechRecognitionService({
    ...options,
    lang: options.lang || speechConfig.recognitionLanguage,
  });
};
