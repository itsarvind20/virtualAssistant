import { useCallback, useMemo, useState } from "react";

export const ASSISTANT_STATES = {
  IDLE: "idle",
  WAKING: "waking",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  SLEEPING: "sleeping",
};

export const useAssistantState = () => {
  const [state, setState] = useState(ASSISTANT_STATES.SLEEPING);
  const [lastWakePhrase, setLastWakePhrase] = useState("");
  const [error, setError] = useState("");

  const transition = useCallback((nextState) => {
    setState(nextState);
  }, []);

  const value = useMemo(
    () => ({
      state,
      setState: transition,
      lastWakePhrase,
      setLastWakePhrase,
      error,
      setError,
      isIdle: state === ASSISTANT_STATES.IDLE,
      isListening: state === ASSISTANT_STATES.LISTENING,
      isThinking: state === ASSISTANT_STATES.THINKING,
      isSpeaking: state === ASSISTANT_STATES.SPEAKING,
      isSleeping: state === ASSISTANT_STATES.SLEEPING,
      isWaking: state === ASSISTANT_STATES.WAKING,
    }),
    [error, lastWakePhrase, state, transition]
  );

  return value;
};
