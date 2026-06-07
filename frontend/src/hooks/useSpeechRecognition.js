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
  const enabledRef = useRef(enabled);
  const pausedRef = useRef(paused);
  const callbacksRef = useRef({ onResult, onInterim, onError });
  const [supported, setSupported] = useState(true);
  const [active, setActive] = useState(false);
  const [provider, setProvider] = useState("loading");
  const [restartCount, setRestartCount] = useState(0);
  const [lastError, setLastError] = useState("");

  enabledRef.current = enabled;
  pausedRef.current = paused;
  callbacksRef.current = { onResult, onInterim, onError };

  const clearRestart = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!enabledRef.current || pausedRef.current) return;
    serviceRef.current?.start();
  }, []);

  const scheduleRestart = useCallback(
    (delay = restartDelay) => {
      if (!enabledRef.current || pausedRef.current) return;

      clearRestart();
      restartTimerRef.current = setTimeout(() => {
        setRestartCount((count) => count + 1);
        start();
      }, delay);
    },
    [clearRestart, restartDelay, start]
  );

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

          scheduleRestart(restartDelay);
        },
        onError: (event) => {
          setActive(false);
          setLastError(event?.message || event?.error || "");
          callbacksRef.current.onError?.(event);

          if (
            enabledRef.current &&
            !pausedRef.current &&
            event?.error !== "not-allowed" &&
            event?.error !== "aborted"
          ) {
            scheduleRestart(restartDelay + 500);
          }
        },
      });

        if (cancelled) {
          service.dispose?.();
          return;
        }

        serviceRef.current = service;
        setProvider(service.provider || "browser");
        if (!pausedRef.current) {
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
  }, [clearRestart, enabled, restartDelay, scheduleRestart, start]);

  useEffect(() => {
    if (!enabled) return;

    if (paused) {
      stop();
    } else {
      start();
    }
  }, [enabled, paused, start, stop]);

  useEffect(() => {
    if (!enabled || paused) return undefined;

    const watchdog = setInterval(() => {
      if (!active && enabledRef.current && !pausedRef.current) {
        scheduleRestart(0);
      }
    }, 4000);

    return () => clearInterval(watchdog);
  }, [active, enabled, paused, scheduleRestart]);

  return {
    supported,
    active,
    provider,
    restartCount,
    lastError,
    start,
    stop,
    abort,
  };
};
