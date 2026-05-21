const INTERRUPT_PATTERNS = [
  /\bstop\b/i,
  /\bpause\b/i,
  /\bcancel\b/i,
  /\bmute\b/i,
  /\bnever mind\b/i,
  /\bnevermind\b/i,
];

export const isInterruptCommand = (text = "") =>
  INTERRUPT_PATTERNS.some((pattern) => pattern.test(text));

export const createTaskController = () => new AbortController();

export const abortTask = (controllerRef) => {
  if (controllerRef.current && !controllerRef.current.signal.aborted) {
    controllerRef.current.abort();
  }

  controllerRef.current = createTaskController();

  return controllerRef.current;
};
