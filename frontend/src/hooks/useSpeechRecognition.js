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
  const startingRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const generationRef = useRef(0);
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

    const service = serviceRef.current;
    if (!service || startingRef.current || service.isActive?.() || service.isStarting?.()) return;

    intentionalStopRef.current = false;
    startingRef.current = true;

    Promise.resolve(service.start())
      .catch((error) => {
        setLastError(error?.message || error?.error || "");
        callbacksRef.current.onError?.(error);
      })
      .finally(() => {
        startingRef.current = false;
      });
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
    intentionalStopRef.current = true;
    startingRef.current = false;
    Promise.resolve(serviceRef.current?.stop()).catch(() => {});
  }, [clearRestart]);

  const abort = useCallback(() => {
    clearRestart();
    intentionalStopRef.current = true;
    startingRef.current = false;
    Promise.resolve(serviceRef.current?.abort()).catch(() => {});
  }, [clearRestart]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    const initialize = async () => {
      try {
        const service = await createBestSpeechRecognitionService({
        onResult: (text) => callbacksRef.current.onResult?.(text),
        onInterim: (text) => callbacksRef.current.onInterim?.(text),
        onStart: () => {
          if (generationRef.current !== generation) return;
          intentionalStopRef.current = false;
          startingRef.current = false;
          setActive(true);
          setLastError("");
        },
        onEnd: () => {
          if (generationRef.current !== generation) return;
          setActive(false);

          if (!intentionalStopRef.current) {
            scheduleRestart(restartDelay);
          }
        },
        onError: (event) => {
          if (generationRef.current !== generation) return;
          startingRef.current = false;
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
          start();
        }
      } catch (error) {
        if (cancelled || generationRef.current !== generation) return;
        setProvider("unavailable");
        setSupported(false);
        callbacksRef.current.onError?.(error);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      generationRef.current += 1;
      clearRestart();
      startingRef.current = false;
      intentionalStopRef.current = true;
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
