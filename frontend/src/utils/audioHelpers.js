export const getBrowserSpeechRecognition = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

export const normalizeSpeechText = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const escapeRegExp = (text = "") =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createBeep = ({ frequency = 880, duration = 120 } = {}) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.value = 0.05;

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration / 1000);

  oscillator.onended = () => context.close().catch(() => {});
};

export const getAssistantAudioConstraints = () => ({
  video: false,
  audio: {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000,
  },
});

export const requestMicrophonePermission = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone API is not available in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia(getAssistantAudioConstraints());
  stream.getTracks().forEach((track) => track.stop());

  return true;
};
