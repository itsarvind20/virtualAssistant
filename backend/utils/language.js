const LANGUAGE_OPTIONS = [
    {
        code: "hi-IN",
        responseLanguage: "hi",
        label: "Hindi",
        script: /[\u0900-\u097F]/,
        words: /\b(hindi|namaste|kaise|kya|mujhe|mera|meri|mere|karo|khol|kholo|chalao|batao|ruk|roko|band|gaana|gana|samay|tarikh|aaj|kal)\b/i
    },
    {
        code: "mr-IN",
        responseLanguage: "mr",
        label: "Marathi",
        words: /\b(marathi|namaskar|kay|majha|majhi|ughada|sanga|thamb|gaane)\b/i
    },
    {
        code: "bn-IN",
        responseLanguage: "bn",
        label: "Bengali",
        script: /[\u0980-\u09FF]/,
        words: /\b(bengali|bangla|bolo|koro|gaan)\b/i
    },
    {
        code: "ta-IN",
        responseLanguage: "ta",
        label: "Tamil",
        script: /[\u0B80-\u0BFF]/,
        words: /\b(tamil|vanakkam|enna|paatu)\b/i
    },
    {
        code: "te-IN",
        responseLanguage: "te",
        label: "Telugu",
        script: /[\u0C00-\u0C7F]/,
        words: /\b(telugu|namaskaram|enti|paata)\b/i
    },
    {
        code: "gu-IN",
        responseLanguage: "gu",
        label: "Gujarati",
        script: /[\u0A80-\u0AFF]/,
        words: /\b(gujarati|kem cho|shu|gaana)\b/i
    },
    {
        code: "kn-IN",
        responseLanguage: "kn",
        label: "Kannada",
        script: /[\u0C80-\u0CFF]/,
        words: /\b(kannada|namaskara|enu|haadu)\b/i
    },
    {
        code: "ml-IN",
        responseLanguage: "ml",
        label: "Malayalam",
        script: /[\u0D00-\u0D7F]/,
        words: /\b(malayalam|namaskaram|entha|paattu)\b/i
    },
    {
        code: "es-ES",
        responseLanguage: "es",
        label: "Spanish",
        words: /\b(hola|gracias|buscar|abre|abrir|reproduce|cancion|música|musica|tiempo|fecha)\b/i
    },
    {
        code: "fr-FR",
        responseLanguage: "fr",
        label: "French",
        words: /\b(bonjour|merci|chercher|ouvre|ouvrir|joue|musique|heure|date)\b/i
    }
];

const DEFAULT_LANGUAGE = {
    code: "en-IN",
    responseLanguage: "en",
    label: "English"
};

const normalizeProvidedLanguage = (language = null) => {

    if (!language || typeof language !== "object") return null;

    const code = String(language.code || "").trim();
    const responseLanguage = String(language.responseLanguage || "").trim();
    const label = String(language.label || "").trim();

    if (!code && !responseLanguage && !label) return null;

    return {
        code: code || DEFAULT_LANGUAGE.code,
        responseLanguage: responseLanguage || (code || DEFAULT_LANGUAGE.code).split("-")[0],
        label: label || DEFAULT_LANGUAGE.label
    };
};

export const detectCommandLanguage = (text = "", providedLanguage = null) => {

    const provided = normalizeProvidedLanguage(providedLanguage);

    if (provided) return provided;

    const command = String(text || "");
    const detected =
        LANGUAGE_OPTIONS.find((option) => option.script?.test(command)) ||
        LANGUAGE_OPTIONS.find((option) => option.words?.test(command));

    return detected
        ? {
            code: detected.code,
            responseLanguage: detected.responseLanguage,
            label: detected.label
        }
        : DEFAULT_LANGUAGE;
};

export const getLanguageInstruction = (language = DEFAULT_LANGUAGE) =>
    `Respond in ${language.label || "the same language as the user"}. If the user mixes languages, respond in the same mixed style.`;

const LOCALIZED = {
    hi: {
        done: "Ho gaya.",
        stopped: "Rok diya.",
        paused: "Pause kar diya.",
        resuming: "Resume kar rahi hoon.",
        next: "Agla gaana chala rahi hoon.",
        unclear: "Maine suna. Kripya phir se koshish karein.",
        noUnderstand: "Maaf kijiye, main theek se samajh nahi paayi.",
        conversationEnded: "Conversation khatam. Jab zaroorat ho mera naam bolna.",
        searchGoogle: (query) => `Google par ${query || "yeh"} search kar rahi hoon.`,
        playMusic: (query) => `${query || "music"} YouTube Music par chala rahi hoon.`,
        playYoutube: (query) => `${query || "pehla result"} YouTube par chala rahi hoon.`,
        currentDate: (value) => `Aaj ki date ${value} hai.`,
        currentTime: (value) => `Abhi time ${value} hai.`,
        currentDay: (value) => `Aaj ${value} hai.`,
        currentMonth: (value) => `Abhi ${value} mahina hai.`
    },
    en: {
        done: "Done.",
        stopped: "Stopped.",
        paused: "Paused.",
        resuming: "Resuming.",
        next: "Playing the next song.",
        unclear: "I heard you. Please try that again.",
        noUnderstand: "Sorry, I couldn't understand that properly.",
        conversationEnded: "Conversation ended. Say my name when you need me again.",
        searchGoogle: (query) => `Searching Google for ${query || "that"}.`,
        playMusic: (query) => `Playing ${query || "music"} on YouTube Music.`,
        playYoutube: (query) => `Playing ${query || "the first result"} on YouTube.`,
        currentDate: (value) => `Current date is ${value}`,
        currentTime: (value) => `Current time is ${value}`,
        currentDay: (value) => `Today is ${value}`,
        currentMonth: (value) => `Current month is ${value}`
    }
};

export const getLocalizedText = (language, key, ...args) => {

    const dictionary = LOCALIZED[language?.responseLanguage] || LOCALIZED.en;
    const value = dictionary[key] || LOCALIZED.en[key] || "";

    return typeof value === "function" ? value(...args) : value;
};

export const withLanguage = (payload = {}, language = DEFAULT_LANGUAGE) => ({
    ...payload,
    language
});
