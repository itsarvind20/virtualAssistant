import { speechConfig } from "./speechConfig";

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const clamp = (value, min, max, fallback) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(max, Math.max(min, number));
};

const preferredNaturalVoiceNames = [
  /microsoft\s+heera/i,
  /microsoft\s+neerja/i,
  /microsoft\s+sonia/i,
  /microsoft\s+aria/i,
  /microsoft\s+jenny/i,
  /google\s+uk\s+english\s+female/i,
  /google\s+us\s+english/i,
  /microsoft\s+zira/i,
];

const voiceStylePatterns = {
  female: [
    /heera/i,
    /neerja/i,
    /sonia/i,
    /aria/i,
    /jenny/i,
    /zira/i,
    /female/i,
    /woman/i,
  ],
  male: [
    /ravi/i,
    /prabhat/i,
    /mark/i,
    /david/i,
    /guy/i,
    /male/i,
    /man/i,
  ],
};

const cleanTextForSpeech = (text = "") =>
  String(text)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_#>`~]/g, "")
    .replace(/\bhttps?:\/\/\S+/gi, "link")
    .replace(/\s+/g, " ")
    .trim();

const getPreferredVoice = (voices, language = "en-IN", preferredVoice = "", voiceStyle = "auto") => {
  const baseLanguage = language.split("-")[0];
  const exactLanguagePattern = new RegExp(`^${escapeRegExp(language)}$`, "i");
  const baseLanguagePattern = new RegExp(`^${escapeRegExp(baseLanguage)}(?:[-_]|$)`, "i");
  const preferred = preferredVoice.trim().toLowerCase();
  const languageVoices = voices.filter((voice) =>
    exactLanguagePattern.test(voice.lang) || baseLanguagePattern.test(voice.lang)
  );

  if (preferred) {
    const selectedVoice = voices.find((voice) => voice.name.toLowerCase().includes(preferred));

    if (selectedVoice) return selectedVoice;
  }

  const stylePatterns = voiceStylePatterns[voiceStyle] || [];
  const styledVoice = stylePatterns
    .map((pattern) => languageVoices.find((voice) => pattern.test(voice.name)))
    .find(Boolean) ||
    stylePatterns
      .map((pattern) => voices.find((voice) => pattern.test(voice.name)))
      .find(Boolean);

  if (styledVoice) return styledVoice;

  const naturalVoice = preferredNaturalVoiceNames
    .map((pattern) => languageVoices.find((voice) => pattern.test(voice.name)))
    .find(Boolean);

  return naturalVoice ||
  languageVoices[0] ||
  voices.find((voice) => /hi[-_]IN/i.test(voice.lang)) ||
  voices.find((voice) => /^hi/i.test(voice.lang)) ||
  voices.find((voice) => /en[-_]IN/i.test(voice.lang)) ||
  voices.find((voice) => /en[-_]US/i.test(voice.lang)) ||
  voices.find((voice) => /^en/i.test(voice.lang)) ||
  voices[0];
};

export const createTtsService = ({ lang = speechConfig.ttsLanguage, voiceStyle = "auto", voiceName = "" } = {}) => {
  const synth = window.speechSynthesis;
  const queue = [];
  let speaking = false;
  let muted = false;

  const cancel = () => {
    queue.length = 0;
    speaking = false;
    synth?.cancel();
  };

  const speakNext = ({ onStart, onEnd, onError } = {}) => {
    if (!synth || speaking || muted || queue.length === 0) return;

    const nextUtterance = queue.shift();
    const text = cleanTextForSpeech(nextUtterance?.text || nextUtterance);
    const utteranceLanguage = nextUtterance?.lang || lang;

    if (!text) {
      speaking = false;
      speakNext({ onStart, onEnd, onError });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();

    utterance.voice = getPreferredVoice(voices, utteranceLanguage, voiceName || speechConfig.ttsVoice, voiceStyle);
    utterance.lang = utterance.voice?.lang || utteranceLanguage;
    utterance.rate = clamp(speechConfig.ttsRate, 0.6, 1.3, 0.92);
    utterance.pitch = clamp(speechConfig.ttsPitch, 0.7, 1.4, 1.04);
    utterance.volume = clamp(speechConfig.ttsVolume, 0, 1, 1);

    speaking = true;
    utterance.onstart = () => onStart?.();
    utterance.onend = () => {
      speaking = false;
      onEnd?.();
      speakNext({ onStart, onEnd, onError });
    };
    utterance.onerror = (event) => {
      speaking = false;
      onError?.(event);
      speakNext({ onStart, onEnd, onError });
    };

    synth.speak(utterance);
  };

  const speak = (text, callbacks = {}) =>
    new Promise((resolve) => {
      if (!text || !synth || muted) {
        resolve();
        return;
      }

      queue.push({
        text,
        lang: callbacks.lang,
      });
      speakNext({
        ...callbacks,
        onEnd: () => {
          callbacks.onEnd?.();
          resolve();
        },
        onError: (event) => {
          callbacks.onError?.(event);
          resolve();
        },
      });
    });

  return {
    speak,
    cancel,
    mute: () => {
      muted = true;
      cancel();
    },
    unmute: () => {
      muted = false;
    },
    isSpeaking: () => speaking,
  };
};
