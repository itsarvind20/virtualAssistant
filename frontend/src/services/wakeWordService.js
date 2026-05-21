import { createBeep, escapeRegExp, normalizeSpeechText } from "../utils/audioHelpers";

const WAKE_PREFIXES = ["hey", "okay", "ok", "hello", "hi", "wake up"];

const unique = (items) => [...new Set(items.filter(Boolean))];

const getNameVariants = (assistantName = "") => {
  const normalizedName = normalizeSpeechText(assistantName);
  const words = normalizedName.split(" ").filter(Boolean);

  return unique([
    normalizedName,
    words[0],
    words.join(""),
  ]);
};

const getAssistantWakePhrases = (assistantName = "") => {
  const nameVariants = getNameVariants(assistantName);

  if (nameVariants.length === 0) {
    return ["hey assistant", "okay assistant", "assistant"];
  }

  return unique(
    nameVariants.flatMap((name) => [
      name,
      ...WAKE_PREFIXES.map((prefix) => `${prefix} ${name}`),
    ])
  );
};

const levenshteinDistance = (left = "", right = "") => {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);

  for (let index = 0; index <= right.length; index += 1) {
    rows[0][index] = index;
  }

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      rows[leftIndex][rightIndex] = Math.min(
        rows[leftIndex - 1][rightIndex] + 1,
        rows[leftIndex][rightIndex - 1] + 1,
        rows[leftIndex - 1][rightIndex - 1] + substitutionCost
      );
    }
  }

  return rows[left.length][right.length];
};

const isCloseNameMatch = (spoken = "", expected = "") => {
  if (!spoken || !expected) return false;
  if (spoken === expected) return true;
  if (expected.length < 4) return false;

  return levenshteinDistance(spoken, expected) <= 1;
};

const findFuzzyWake = (normalizedText, assistantName) => {
  const nameVariants = getNameVariants(assistantName);
  const tokens = normalizedText.split(" ").filter(Boolean);
  const searchWindow = tokens.slice(0, 5);

  for (let index = 0; index < searchWindow.length; index += 1) {
    const token = searchWindow[index];
    const matchedName = nameVariants.find((name) => isCloseNameMatch(token, name));

    if (!matchedName) continue;

    const previous = searchWindow[index - 1] || "";
    const twoPrevious = `${searchWindow[index - 2] || ""} ${previous}`.trim();
    const hasWakePrefix =
      WAKE_PREFIXES.includes(previous) ||
      WAKE_PREFIXES.includes(twoPrevious) ||
      index === 0;

    if (!hasWakePrefix) continue;

    return {
      phrase: token,
      trailingCommand: tokens.slice(index + 1).join(" "),
    };
  }

  return null;
};

export const createWakeWordService = ({
  assistantName,
  wakePhrases,
  onWake,
} = {}) => {
  const phrases = unique([
    ...getAssistantWakePhrases(assistantName),
    ...(wakePhrases || []).map(normalizeSpeechText),
  ]).sort((left, right) => right.length - left.length);

  const wakeRegex = new RegExp(
    `\\b(${phrases.map(escapeRegExp).join("|")})\\b`,
    "i"
  );

  const detect = (text = "") => {
    const normalized = normalizeSpeechText(text);
    const match = normalized.match(wakeRegex);

    if (match) {
      createBeep();
      onWake?.(match[0]);

      return {
        phrase: match[0],
        trailingCommand: normalized.replace(wakeRegex, "").trim(),
      };
    }

    const fuzzyWake = findFuzzyWake(normalized, assistantName);

    if (!fuzzyWake) return null;

    createBeep();
    onWake?.(fuzzyWake.phrase);

    return fuzzyWake;
  };

  return {
    detect,
    phrases,
  };
};

export const PORCUPINE_SETUP_NOTE =
  "For production offline wake words, add @picovoice/porcupine-web with a Picovoice access key and keyword model files, then call this service before browser speech recognition fallback.";
