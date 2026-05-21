import { createBeep } from "../utils/audioHelpers";
import { isPorcupineConfigured, speechConfig } from "./speechConfig";

export const createPorcupineWakeService = async ({ assistantName, onWake, onError } = {}) => {
  if (!isPorcupineConfigured()) {
    throw new Error("Porcupine is not configured. Add VITE_PICOVOICE_ACCESS_KEY and VITE_PORCUPINE_KEYWORD_PATH.");
  }

  const [{ PorcupineWorker }, { WebVoiceProcessor }] = await Promise.all([
    import("@picovoice/porcupine-web"),
    import("@picovoice/web-voice-processor"),
  ]);

  let subscribed = false;

  const keywordModel = {
    publicPath: speechConfig.porcupineKeywordPath,
    label: assistantName || "assistant",
    sensitivity: speechConfig.porcupineSensitivity,
  };

  const porcupineModel = {
    publicPath: speechConfig.porcupineModelPath,
  };

  const worker = await PorcupineWorker.create(
    speechConfig.picovoiceAccessKey,
    [keywordModel],
    (detection) => {
      createBeep();
      onWake?.(detection?.label || assistantName || "assistant");
    },
    porcupineModel
  );

  const start = async () => {
    if (subscribed) return;

    try {
      await WebVoiceProcessor.subscribe(worker);
      subscribed = true;
    } catch (error) {
      onError?.(error);
      throw error;
    }
  };

  const stop = async () => {
    if (!subscribed) return;

    await WebVoiceProcessor.unsubscribe(worker).catch(() => {});
    subscribed = false;
  };

  const dispose = async () => {
    await stop();
    worker.release?.();
    worker.terminate?.();
  };

  return {
    start,
    stop,
    dispose,
    provider: "porcupine",
  };
};
