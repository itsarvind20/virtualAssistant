import uploadOnCloudinary from "../config/cloudinary.js";
import groqResponse from "../groq.js";
import User from "../models/user.model.js";
import moment from "moment";
import executeCommand from "../commandExecutor.js";
import playMusic, { nextMusic, pauseMusic, resumeMusic, stopMusic } from "../utils/playMusic.js";
import playFirstYoutubeVideo from "../utils/playYoutubeVideo.js";
import { detectCommandLanguage, getLanguageInstruction, getLocalizedText, withLanguage } from "../utils/language.js";

const MUSIC_TYPES = ["play-music", "youtube-music-play"];

const DESKTOP_COMMAND_TYPES = [
    "open-chrome",
    "open-notepad",
    "open-vscode",
    "calculator-open"
];

const LOCAL_INTENT_TYPES = [
    ...MUSIC_TYPES,
    ...DESKTOP_COMMAND_TYPES,
    "open-youtube",
    "google-search",
    "youtube-search",
    "youtube-play",
    "instagram-open",
    "facebook-open",
    "weather-show",
    "get-time",
    "get-date",
    "get-day",
    "get-month",
    "pause-media",
    "resume-media",
    "next-media",
    "cancel-command",
    "end-conversation"
];

const escapeRegExp = (text = "") =>
    String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeCommand = (text = "") =>
    String(text)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

const stripAssistantName = (text = "", assistantName = "") => {

    if (!assistantName) return String(text).trim();

    return String(text)
        .replace(new RegExp(`\\b${escapeRegExp(assistantName)}\\b`, "gi"), "")
        .replace(/\s+/g, " ")
        .trim();
};

const isAiFailureResponse = (aiResult = {}) => {

    const response = normalizeCommand(aiResult.response || "");

    return aiResult.type === "general" &&
        (
            response.includes("something went wrong") ||
            response.includes("couldn t understand") ||
            response.includes("could not understand")
        );
};

const hasMusicIntent = (text = "") => {

    const normalized = normalizeCommand(text);

    if (hasYoutubeVideoIntent(normalized)) return false;

    return /\b(youtube music|music|song|songs|track|album|artist|playlist|gaana|gana)\b/.test(normalized) ||
        /\b(play|plau|listen to|put on|chalao|lagao)\b/.test(normalized) ||
        /गाना|संगीत|चलाओ|लगाओ/.test(normalized);
};

const hasYoutubeVideoIntent = (text = "") => {

    const normalized = normalizeCommand(text);

    if (isOpenYoutubeOnly(normalized)) return false;

    return (
        /\b(search|find|play|playing|show)\b.*\b(youtube|you tube)\b/.test(normalized) ||
        /\b(youtube|you tube)\b.*\b(search|find|play|playing|show)\b/.test(normalized) ||
        (/\b(youtube|you tube)\b/.test(normalized) && /\b(video|videos)\b/.test(normalized))
    ) && !/\byoutube music\b/.test(normalized);
};

const isOpenYoutubeOnly = (text = "") => {

    const normalized = normalizeCommand(text);

    return /^(please\s+)?(open|launch|start)\s+(youtube|you tube)(\s+(app|site|website))?$/.test(normalized);
};

const inferMusicQuery = (text = "", assistantName = "") => {

    const assistantPattern = assistantName
        ? new RegExp(`\\b${escapeRegExp(assistantName)}\\b`, "gi")
        : null;

    let query = String(text);

    if (assistantPattern) {

        query = query.replace(assistantPattern, "");
    }

    return query
        .replace(/\b(please|can you|could you|would you)\b/gi, "")
        .replace(/\b(play|plau|listen to|put on|chalao|lagao)\b/gi, "")
        .replace(/\b(the )?(song|music|track|gaana|gana)\b/gi, "")
        .replace(/गाना|संगीत|चलाओ|लगाओ/gi, "")
        .replace(/\b(on|in)\s+youtube\s+music\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
};

const inferObviousCommandType = (text = "") => {

    const normalized = normalizeCommand(text);

    if (!normalized) return null;

    if (/\b(stop|cancel|mute|never mind|nevermind|ruk|roko|band|bas)\b/.test(normalized) || /रुको|रोको|बंद/.test(normalized)) return "cancel-command";
    if (/\b(end conversation|end chat|finish conversation|close conversation|that is all|that s all|goodbye|bye|we are done|conversation over)\b/.test(normalized)) return "end-conversation";
    if (/\b(next|skip|skip song|next song|next track|agla|agli)\b/.test(normalized) || /अगला|अगली/.test(normalized)) return "next-media";
    if (/\b(pause|rok do|roko)\b/.test(normalized) || /पॉज|रोक/.test(normalized)) return "pause-media";
    if (/^(resume|continue)$/.test(normalized) || /\b(resume|continue|chalu|chalao|jaari)\b/.test(normalized) || /चालू|चलाओ|जारी/.test(normalized)) return "resume-media";

    if (/\b(time|current time|samay|waqt)\b/.test(normalized) || /समय|वक्त|टाइम/.test(normalized)) return "get-time";
    if (/\b(date|today date|tarikh|tareekh)\b/.test(normalized) || /तारीख|डेट/.test(normalized)) return "get-date";
    if (/\b(day|today day|din)\b/.test(normalized) || /दिन/.test(normalized)) return "get-day";
    if (/\b(month|current month|mahina)\b/.test(normalized) || /महीना/.test(normalized)) return "get-month";

    if (/\b(open|start|launch|khol|kholo)\s+(chrome|google chrome)\b/.test(normalized) || /क्रोम.*खोल|खोल.*क्रोम/.test(normalized)) return "open-chrome";
    if (/\b(open|start|launch|khol|kholo)\s+notepad\b/.test(normalized) || /नोटपैड.*खोल|खोल.*नोटपैड/.test(normalized)) return "open-notepad";
    if (/\b(open|start|launch|khol|kholo)\s+(vs code|vscode|visual studio code)\b/.test(normalized) || /वी एस कोड.*खोल|खोल.*वी एस कोड/.test(normalized)) return "open-vscode";
    if (/\b(open|start|launch|khol|kholo)\s+(calculator|calc)\b/.test(normalized) || /कैलकुलेटर.*खोल|खोल.*कैलकुलेटर/.test(normalized)) return "calculator-open";

    if (isOpenYoutubeOnly(normalized)) return "open-youtube";
    if (/\b(open|start|launch|khol|kholo)\s+instagram\b/.test(normalized)) return "instagram-open";
    if (/\b(open|start|launch|khol|kholo)\s+facebook\b/.test(normalized)) return "facebook-open";
    if (/\b(weather|temperature|forecast|mausam)\b/.test(normalized) || /मौसम|तापमान/.test(normalized)) return "weather-show";

    if (hasYoutubeVideoIntent(normalized)) return "youtube-search";
    if (/\byoutube\b/.test(normalized) && /\b(video|videos)\b/.test(normalized)) return "youtube-search";
    if (/\b(google|search google|google search|search for|search karo|dhundo)\b/.test(normalized) || /गूगल|सर्च|ढूंढ/.test(normalized)) return "google-search";

    return null;
};

const cleanMusicQuery = (text = "", assistantName = "") => {

    const assistantPattern = assistantName
        ? new RegExp(`\\b${escapeRegExp(assistantName)}\\b`, "gi")
        : null;

    let query = text;

    if (assistantPattern) {

        query = query.replace(assistantPattern, "");
    }

    return query
        .replace(/\b(on|in)\s+youtube\s+music\b/gi, "")
        .replace(/\b(play|plau|chalao|lagao)\b/gi, "")
        .replace(/\b(song|gaana|gana)\b/gi, "")
        .replace(/गाना|संगीत|चलाओ|लगाओ/gi, "")
        .trim();
};

const cleanYoutubeQuery = (text = "", assistantName = "") =>
    stripAssistantName(text, assistantName)
        .replace(/\b(please|can you|could you|would you)\b/gi, "")
        .replace(/\b(search|find|play|playing|open|show)\b/gi, "")
        .replace(/\b(on|in)\s+(youtube|you tube)\b/gi, "")
        .replace(/\b(youtube|you tube)\b/gi, "")
        .replace(/\b(video|videos)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

const formatTarget = (text = "", fallback = "that") =>
    String(text).trim() || fallback;

const getCommandResponse = (language, type, userInput = "") => {

    if (MUSIC_TYPES.includes(type)) {
        return getLocalizedText(language, "playMusic", formatTarget(userInput, "music"));
    }

    if (["youtube-search", "youtube-play"].includes(type)) {
        return getLocalizedText(language, "playYoutube", formatTarget(userInput, "the first result"));
    }

    if (type === "google-search") {
        return getLocalizedText(language, "searchGoogle", formatTarget(userInput));
    }

    if (type === "cancel-command") return getLocalizedText(language, "stopped");
    if (type === "pause-media") return getLocalizedText(language, "paused");
    if (type === "resume-media") return getLocalizedText(language, "resuming");
    if (type === "next-media") return getLocalizedText(language, "next");
    if (type === "end-conversation") return getLocalizedText(language, "conversationEnded");

    return getLocalizedText(language, "done");
};

const runInBackground = (task, label = "background task") => {

    Promise.resolve()
        .then(task)
        .catch((error) => {
            console.log(`${label} failed:`, error?.message || error);
        });
};


// ====================================
// GET CURRENT USER
// ====================================

export const getCurrentUser = async (req, res) => {

    try {

        const user = await User.findById(req.userId)
            .select("-password");

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json(user);

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Get current user error"
        });
    }
};



// ====================================
// UPDATE ASSISTANT
// ====================================

export const updateAssistant = async (req, res) => {

    try {

        const { assistantName, assistantVoice = "auto", assistantVoiceName = "", imageUrl } = req.body;
        const trimmedAssistantName = String(assistantName || "").trim();
        const trimmedImageUrl = String(imageUrl || "").trim();

        if (!trimmedAssistantName) {
            return res.status(400).json({
                message: "Assistant name is required"
            });
        }
        const normalizedAssistantVoice = ["auto", "female", "male"].includes(assistantVoice)
            ? assistantVoice
            : "auto";

        let assistantImage;

        if (req.file) {

            assistantImage =
                await uploadOnCloudinary(req.file.path);

        } else {

            assistantImage = trimmedImageUrl;
        }

        if (!assistantImage) {
            return res.status(400).json({
                message: "Please choose or upload an assistant image"
            });
        }

        const user = await User.findByIdAndUpdate(

            req.userId,

            {
                assistantName: trimmedAssistantName,
                assistantImage,
                assistantVoice: normalizedAssistantVoice,
                assistantVoiceName: String(assistantVoiceName).trim()
            },

            {
                new: true
            }

        ).select("-password");

        return res.status(200).json(user);

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Update assistant error"
        });
    }
};



// ====================================
// ASK TO ASSISTANT
// ====================================

export const askToAssistant = async (req, res) => {

    try {

        const { command, history = [], systemPrompt = "", localIntent = null, language: requestLanguage = null } = req.body;
        const commandLanguage = detectCommandLanguage(command, requestLanguage);
        const responseLanguage = (payload) => withLanguage(payload, commandLanguage);

        if (!command) {

            return res.status(400).json(responseLanguage({
                response: "Command is required"
            }));
        }


        // ====================================
        // FIND USER
        // ====================================

        const user = await User.findById(req.userId);

        if (!user) {

            return res.status(404).json(responseLanguage({
                response: "User not found"
            }));
        }


        // ====================================
        // SAVE HISTORY
        // ====================================

        user.history.push(command);

        await user.save();


        const userName = user.name;

        const assistantName = user.assistantName;

        const commandWithoutWakeWord =
            stripAssistantName(command, assistantName);

        const commandForAssistant =
            commandWithoutWakeWord || command;

        if (!commandWithoutWakeWord && normalizeCommand(command) === normalizeCommand(assistantName)) {

            return res.status(200).json(responseLanguage({

                type: "general",
                userInput: "",
                response:
                    `Yes, ${userName}?`
            }));
        }


        // ====================================
        // AI RESPONSE
        // ====================================

        let aiResult;

        if (
            localIntent &&
            LOCAL_INTENT_TYPES.includes(localIntent.type)
        ) {

            aiResult = {
                type: localIntent.type,
                userInput: localIntent.userInput || commandForAssistant,
                response: getCommandResponse(
                    commandLanguage,
                    localIntent.type,
                    localIntent.userInput || commandForAssistant
                ),
                language: commandLanguage
            };

        } else {

            const result = await groqResponse(
                commandForAssistant,
                assistantName,
                userName,
                history,
                [
                    systemPrompt,
                    getLanguageInstruction(commandLanguage)
                ].filter(Boolean).join("\n"),
                commandLanguage
            );

            console.log("RAW AI RESPONSE:", result);


            // ====================================
            // PARSE JSON
            // ====================================

            try {

                aiResult = JSON.parse(result);

            } catch (parseError) {

                console.log(
                    "JSON Parse Error:",
                    parseError
                );

                return res.status(200).json(responseLanguage({

                    type: "general",
                    userInput: commandForAssistant,
                    response:
                        getLocalizedText(commandLanguage, "noUnderstand")
                }));
            }
        }

        aiResult.language = commandLanguage;


        const obviousType = inferObviousCommandType(commandForAssistant);

        const inferredMusicQuery = inferMusicQuery(commandForAssistant, assistantName);

        const aiFailed = isAiFailureResponse(aiResult);

        if (hasYoutubeVideoIntent(commandForAssistant)) {

            const youtubeQuery =
                cleanYoutubeQuery(commandForAssistant, assistantName) ||
                commandForAssistant;

            aiResult = {
                ...aiResult,
                type: "youtube-search",
                userInput: youtubeQuery,
                response: getLocalizedText(commandLanguage, "playYoutube", formatTarget(youtubeQuery, "the first result"))
            };

        } else if (
            (
                !MUSIC_TYPES.includes(aiResult.type) ||
                aiFailed
            ) &&
            hasMusicIntent(commandForAssistant) &&
            inferredMusicQuery
        ) {

            aiResult = {
                ...aiResult,
                type: "play-music",
                userInput: inferredMusicQuery,
                response: getLocalizedText(commandLanguage, "playMusic", formatTarget(inferredMusicQuery))
            };

        } else if (
            aiFailed &&
            obviousType
        ) {

            aiResult = {
                ...aiResult,
                type: obviousType,
                userInput: commandForAssistant,
                response: getLocalizedText(commandLanguage, "done")
            };

        } else if (aiFailed) {

            aiResult = {
                ...aiResult,
                userInput: commandForAssistant,
                response: getLocalizedText(commandLanguage, "unclear")
            };

        } else if (MUSIC_TYPES.includes(aiResult.type) && !hasMusicIntent(commandForAssistant)) {

            aiResult = {
                ...aiResult,
                type: obviousType || "general",
                userInput: commandForAssistant,
                response: obviousType
                    ? aiResult.response
                    : getLocalizedText(commandLanguage, "unclear")
            };

        } else if (
            obviousType &&
            !MUSIC_TYPES.includes(obviousType) &&
            MUSIC_TYPES.includes(aiResult.type)
        ) {

            aiResult.type = obviousType;
            aiResult.userInput = commandForAssistant;
        }

        const type = aiResult.type;

        if (
            MUSIC_TYPES.includes(type)
        ) {

            aiResult.userInput =
                cleanMusicQuery(aiResult.userInput, assistantName) ||
                cleanMusicQuery(commandForAssistant, assistantName);

            aiResult.response =
                getLocalizedText(commandLanguage, "playMusic", formatTarget(aiResult.userInput));
        }

        if (["youtube-search", "youtube-play"].includes(type)) {

            aiResult.userInput =
                cleanYoutubeQuery(aiResult.userInput, assistantName) ||
                cleanYoutubeQuery(commandForAssistant, assistantName) ||
                commandForAssistant;

            aiResult.response =
                getLocalizedText(commandLanguage, "playYoutube", formatTarget(aiResult.userInput, "the first result"));
        }


        // ====================================
        // RESPONSE HANDLER
        // ====================================

        switch (type) {


            // ====================================
            // DATE/TIME COMMANDS
            // ====================================

            case "get-date":

                return res.json(responseLanguage({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        getLocalizedText(commandLanguage, "currentDate", moment().format("YYYY-MM-DD"))
                }));


            case "get-time":

                return res.json(responseLanguage({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        getLocalizedText(commandLanguage, "currentTime", moment().format("hh:mm A"))
                }));


            case "get-day":

                return res.json(responseLanguage({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        getLocalizedText(commandLanguage, "currentDay", moment().format("dddd"))
                }));


            case "get-month":

                return res.json(responseLanguage({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        getLocalizedText(commandLanguage, "currentMonth", moment().format("MMMM"))
                }));


            case "cancel-command":

                await stopMusic();

                return res.json(responseLanguage({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        getLocalizedText(commandLanguage, "stopped")
                }));


            case "end-conversation":

                return res.json(responseLanguage({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        getLocalizedText(commandLanguage, "conversationEnded")
                }));


            case "pause-media":

                await pauseMusic();

                return res.json(responseLanguage({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        getLocalizedText(commandLanguage, "paused")
                }));


            case "resume-media":

                await resumeMusic();

                return res.json(responseLanguage({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        getLocalizedText(commandLanguage, "resuming")
                }));


            case "next-media":

                await nextMusic();

                return res.json(responseLanguage({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        getLocalizedText(commandLanguage, "next")
                }));
                

            // ====================================
            // NORMAL COMMANDS
            // ====================================

            case "google-search":

            case "youtube-search":

            case "youtube-play":

            case "general":

            case "calculator-open":

            case "instagram-open":

            case "facebook-open":

            case "weather-show":

            case "open-chrome":

            case "open-notepad":

            case "open-vscode":

            case "open-youtube":

            case "play-music":

            case "youtube-music-play":
            
            case "send-email":


                if (DESKTOP_COMMAND_TYPES.includes(type)) {

                    await executeCommand(
                        type,
                        aiResult.userInput
                    );
                }

                if (MUSIC_TYPES.includes(type)) {

                    runInBackground(
                        () => playMusic(aiResult.userInput),
                        "Music playback"
                    );
                }

                if (["youtube-search", "youtube-play"].includes(type)) {

                    await playFirstYoutubeVideo(
                        aiResult.userInput
                    );
                }

                return res.json(responseLanguage({

                    type,

                    userInput:
                        aiResult.userInput,

                    response:
                        aiResult.response
                }));


            // ====================================
            // DEFAULT
            // ====================================

            default:

                return res.status(200).json(responseLanguage({

                    type: "general",
                    userInput: aiResult.userInput || command,
                    response:
                        getLocalizedText(commandLanguage, "noUnderstand")
                }));
        }

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            response: "Ask assistant error"
        });
    }
};
