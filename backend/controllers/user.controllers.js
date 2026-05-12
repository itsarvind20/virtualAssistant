import uploadOnCloudinary from "../config/cloudinary.js";
import groqResponse from "../groq.js";
import User from "../models/user.model.js";
import moment from "moment";
import executeCommand from "../commandExecutor.js";
import sendMail from "../utils/playMusic.js";

const cleanMusicQuery = (text = "", assistantName = "") => {

    const assistantPattern = assistantName
        ? new RegExp(`\\b${assistantName}\\b`, "gi")
        : null;

    let query = text;

    if (assistantPattern) {

        query = query.replace(assistantPattern, "");
    }

    return query
        .replace(/\b(on|in)\s+youtube\s+music\b/gi, "")
        .replace(/\bplay\b/gi, "")
        .replace(/\bsong\b/gi, "")
        .trim();
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

        const { assistantName, imageUrl } = req.body;

        let assistantImage;

        if (req.file) {

            assistantImage =
                await uploadOnCloudinary(req.file.path);

        } else {

            assistantImage = imageUrl;
        }

        const user = await User.findByIdAndUpdate(

            req.userId,

            {
                assistantName,
                assistantImage
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

        const { command, history = [], systemPrompt = "" } = req.body;

        if (!command) {

            return res.status(400).json({
                response: "Command is required"
            });
        }


        // ====================================
        // FIND USER
        // ====================================

        const user = await User.findById(req.userId);

        if (!user) {

            return res.status(404).json({
                response: "User not found"
            });
        }


        // ====================================
        // SAVE HISTORY
        // ====================================

        user.history.push(command);

        await user.save();


        const userName = user.name;

        const assistantName = user.assistantName;


        // ====================================
        // AI RESPONSE
        // ====================================

        const result = await groqResponse(
            command,
            assistantName,
            userName,
            history,
            systemPrompt
        );

        console.log("RAW AI RESPONSE:", result);


        // ====================================
        // PARSE JSON
        // ====================================

        let aiResult;

        try {

            aiResult = JSON.parse(result);

        } catch (parseError) {

            console.log(
                "JSON Parse Error:",
                parseError
            );

            return res.status(200).json({

                type: "general",
                userInput: command,
                response:
                    "Sorry, I couldn't understand that properly."
            });
        }


        const type = aiResult.type;

        if (
            ["play-music", "youtube-music-play"].includes(type)
        ) {

            aiResult.userInput =
                cleanMusicQuery(aiResult.userInput, assistantName) ||
                cleanMusicQuery(command, assistantName);
        }


        // ====================================
        // RESPONSE HANDLER
        // ====================================

        switch (type) {


            // ====================================
            // DATE/TIME COMMANDS
            // ====================================

            case "get-date":

                return res.json({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        `Current date is ${moment().format("YYYY-MM-DD")}`
                });


            case "get-time":

                return res.json({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        `Current time is ${moment().format("hh:mm A")}`
                });


            case "get-day":

                return res.json({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        `Today is ${moment().format("dddd")}`
                });


            case "get-month":

                return res.json({

                    type,

                    userInput: aiResult.userInput,

                    response:
                        `Current month is ${moment().format("MMMM")}`
                });
                

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


                if (
                    [
                        "open-chrome",
                        "open-notepad",
                        "open-vscode"
                    ].includes(type)
                ) {

                    await executeCommand(
                        type,
                        aiResult.userInput
                    );
                }

return res.json({

   type,

   userInput: aiResult.userInput,

   response: aiResult.response
});



            // ====================================
            // DEFAULT
            // ====================================

            default:

                return res.status(200).json({

                    type: "general",
                    userInput: aiResult.userInput || command,
                    response:
                        "I didn't understand that command."
                });
        }

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            response: "Ask assistant error"
        });
    }
};
