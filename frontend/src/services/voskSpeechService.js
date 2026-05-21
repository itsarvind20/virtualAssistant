import { getAssistantAudioConstraints, normalizeSpeechText } from "../utils/audioHelpers";
import { isVoskConfigured, speechConfig } from "./speechConfig";

let cachedModel = null;

const loadVoskModel = async () => {
  if (cachedModel) return cachedModel;

  if (!isVoskConfigured()) {
    throw new Error("Vosk is not configured. Add VITE_VOSK_MODEL_PATH pointing to a public model.tar.gz.");
  }

  const voskModule = await import("vosk-browser");
  const Vosk = voskModule.default || voskModule;
  cachedModel = await Vosk.createModel(speechConfig.voskModelPath);

  return cachedModel;
};

export const createVoskSpeechRecognitionService = async ({
  onResult,
  onInterim,
  onStart,
  onEnd,
  onError,
} = {}) => {
  const model = await loadVoskModel();
  const recognizer = new model.KaldiRecognizer();

  let audioContext = null;
  let recognizerNode = null;
  let source = null;
  let stream = null;
  let active = false;
  let disposed = false;

  recognizer.on("result", (message) => {
    const text = normalizeSpeechText(message?.result?.text || "");

    if (text) onResult?.(text);
  });

  recognizer.on("partialresult", (message) => {
    const partial = normalizeSpeechText(message?.result?.partial || "");

    if (partial) onInterim?.(partial);
  });

  const start = async () => {
    if (disposed || active) return;

    try {
      stream = await navigator.mediaDevices.getUserMedia(getAssistantAudioConstraints());
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      audioContext = new AudioContext({ sampleRate: 16000 });
      recognizerNode = audioContext.createScriptProcessor(4096, 1, 1);

      recognizerNode.onaudioprocess = (event) => {
        try {
          recognizer.acceptWaveform(event.inputBuffer);
        } catch (error) {
          onError?.(error);
        }
      };

      source = audioContext.createMediaStreamSource(stream);
      source.connect(recognizerNode);
      recognizerNode.connect(audioContext.destination);
      active = true;
      onStart?.();
    } catch (error) {
      active = false;
      onError?.(error);
      throw error;
    }
  };

  const stop = async () => {
    if (!active) return;

    recognizerNode?.disconnect();
    source?.disconnect();
    stream?.getTracks().forEach((track) => track.stop());
    await audioContext?.close().catch(() => {});

    recognizerNode = null;
    source = null;
    stream = null;
    audioContext = null;
    active = false;
    onEnd?.();
  };

  const abort = () => {
    stop();
  };

  const dispose = () => {
    disposed = true;
    stop();
    recognizer.remove?.();
  };

  return {
    start,
    stop,
    abort,
    dispose,
    isActive: () => active,
    provider: "vosk",
  };
};
