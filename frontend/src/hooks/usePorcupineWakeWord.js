import { useEffect, useRef, useState } from "react";
import { createPorcupineWakeService } from "../services/porcupineWakeService";
import { isPorcupineConfigured } from "../services/speechConfig";

export const usePorcupineWakeWord = ({
  enabled,
  assistantName,
  onWake,
  onError,
}) => {
  const serviceRef = useRef(null);
  const onWakeRef = useRef(onWake);
  const onErrorRef = useRef(onError);
  const [active, setActive] = useState(false);
  const [available, setAvailable] = useState(isPorcupineConfigured());

  onWakeRef.current = onWake;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled || !isPorcupineConfigured()) {
      setAvailable(isPorcupineConfigured());
      return undefined;
    }

    let cancelled = false;

    const initialize = async () => {
      try {
        const service = await createPorcupineWakeService({
          assistantName,
          onWake: (phrase) => onWakeRef.current?.(phrase),
          onError: (error) => onErrorRef.current?.(error),
        });

        if (cancelled) {
          await service.dispose();
          return;
        }

        serviceRef.current = service;
        await service.start();
        setActive(true);
        setAvailable(true);
      } catch (error) {
        setActive(false);
        setAvailable(false);
        onErrorRef.current?.(error);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      setActive(false);
      serviceRef.current?.dispose();
      serviceRef.current = null;
    };
  }, [assistantName, enabled]);

  return {
    active,
    available,
  };
};
