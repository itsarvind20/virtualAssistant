const getPreferredVoice = (voices) =>
  voices.find((voice) => /en[-_]IN/i.test(voice.lang)) ||
  voices.find((voice) => /en[-_]US/i.test(voice.lang)) ||
  voices.find((voice) => /^en/i.test(voice.lang)) ||
  voices[0];

export const createTtsService = () => {
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

    const text = queue.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();

    utterance.voice = getPreferredVoice(voices);
    utterance.lang = utterance.voice?.lang || "en-IN";
    utterance.rate = 0.96;
    utterance.pitch = 1;

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

      queue.push(text);
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
