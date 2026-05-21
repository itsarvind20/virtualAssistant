import { useMemo } from "react";
import { createWakeWordService } from "../services/wakeWordService";

export const useWakeWord = ({ assistantName, onWake }) =>
  useMemo(
    () =>
      createWakeWordService({
        assistantName,
        onWake,
      }),
    [assistantName, onWake]
  );
