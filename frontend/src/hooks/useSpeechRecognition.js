import { useCallback, useEffect, useRef, useState } from "react";
import { createBestSpeechRecognitionService } from "../services/speechService";

export const useSpeechRecognition = ({
  enabled,
  paused,
  onResult,
  onInterim,
  onError,
  restartDelay = 700,
}) => {
  const serviceRef = useRef(null);
  const restartTimerRef = useRef(null);
  const callbacksRef = useRef({ onResult, onInterim, onError });
  const [supported, setSupported] = useState(true);
  const [active, setActive] = useState(false);
  const [provider, setProvider] = useState("loading");

  callbacksRef.current = { onResult, onInterim, onError };

  const clearRestart = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!enabled || paused) return;
    serviceRef.current?.start();
  }, [enabled, paused]);

  const stop = useCallback(() => {
    clearRestart();
    serviceRef.current?.stop();
  }, [clearRestart]);

  const abort = useCallback(() => {
    clearRestart();
    serviceRef.current?.abort();
  }, [clearRestart]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const initialize = async () => {
      try {
        const service = await createBestSpeechRecognitionService({
        onResult: (text) => callbacksRef.current.onResult?.(text),
        onInterim: (text) => callbacksRef.current.onInterim?.(text),
        onStart: () => setActive(true),
        onEnd: () => {
          setActive(false);

          if (!paused) {
            clearRestart();
            restartTimerRef.current = setTimeout(start, restartDelay);
          }
        },
        onError: (event) => {
          setActive(false);
          callbacksRef.current.onError?.(event);

          if (!paused && event?.error !== "not-allowed") {
            clearRestart();
            restartTimerRef.current = setTimeout(start, restartDelay + 500);
          }
        },
      });

        if (cancelled) {
          service.dispose?.();
          return;
        }

        serviceRef.current = service;
        setProvider(service.provider || "browser");
        if (!paused) {
          service.start();
        }
      } catch (error) {
        setProvider("unavailable");
        setSupported(false);
        callbacksRef.current.onError?.(error);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      clearRestart();
      serviceRef.current?.dispose();
      serviceRef.current = null;
    };
  }, [clearRestart, enabled, paused, restartDelay, start]);

  useEffect(() => {
    if (!enabled) return;

    if (paused) {
      stop();
    } else {
      start();
    }
  }, [enabled, paused, start, stop]);

  return {
    supported,
    active,
    provider,
    start,
    stop,
    abort,
  };
};
