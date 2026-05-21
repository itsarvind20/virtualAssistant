export const createSilenceTimer = ({ timeoutMs = 5500, onTimeout }) => {
  let timerId = null;

  const clear = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const reset = () => {
    clear();
    timerId = setTimeout(() => {
      timerId = null;
      onTimeout?.();
    }, timeoutMs);
  };

  return {
    reset,
    clear,
  };
};
