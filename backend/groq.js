import axios from "axios";

const groqResponse = async (
    command,
    assistantName,
    userName,
    history = [],
    extraSystemPrompt = ""
) => {

    try {

        // ====================================
        // SYSTEM PROMPT
        // ====================================

        const systemPrompt = `
You are a virtual assistant named ${assistantName}
created by ${userName}.

You behave like a smart voice-enabled desktop assistant.

IMPORTANT RULES:

- Respond ONLY in valid JSON.
- Do NOT write explanations.
- Do NOT write markdown.
- Do NOT write code blocks.
- Do NOT write extra text.

JSON FORMAT:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show" | "open-chrome" | "open-notepad" | "open-vscode" | "open-youtube" | "play-music" | "spotify-play" | "youtube-music-play" | "send-email",

  "userInput": "<clean user input>",

  "response": "<short voice-friendly response>"
}

Rules:

- Remove assistant name from userInput.
- For Google/YouTube search,
  keep ONLY search query in userInput.
- For music requests like "play song name", set type to "play-music" and keep only the song/artist in userInput.
- If the user says Spotify, set type to "spotify-play".
- If the user says YouTube Music, set type to "youtube-music-play".
- If no music service is mentioned, use "play-music".
- Keep response short and natural.
- Use the conversation history when it helps answer follow-up questions.
- If asked "who created you",
  mention ${userName}.

${extraSystemPrompt ? `Additional behavior:\n${extraSystemPrompt}` : ""}
`;

        const safeHistory = Array.isArray(history)
            ? history
                .filter((message) =>
                    message &&
                    ["user", "assistant"].includes(message.role) &&
                    typeof message.content === "string"
                )
                .slice(-20)
                .map((message) => ({
                    role: message.role,
                    content: message.content
                }))
            : [];



        // ====================================
        // GROQ API CALL
        // ====================================

        const response = await axios.post(

            "https://api.groq.com/openai/v1/chat/completions",

            {
                "model": "llama-3.3-70b-versatile",

                messages: [

                    {
                        role: "system",
                        content: systemPrompt
                    },

                    ...safeHistory,

                    {
                        role: "user",
                        content: command
                    }
                ],

                temperature: 0.3,

                max_tokens: 150
            },

            {
                headers: {

                    Authorization:
                        `Bearer ${process.env.GROQ_API_KEY}`,

                    "Content-Type": "application/json"
                }
            }
        );



        // ====================================
        // CLEAN RESPONSE
        // ====================================

        const rawResponse =
            response.data.choices[0].message.content;

        console.log("RAW GROQ RESPONSE:", rawResponse);


        // EXTRACT JSON
        const jsonMatch =
            rawResponse.match(/{[\s\S]*}/);

        if (!jsonMatch) {

            return JSON.stringify({

                type: "general",

                userInput: command,

                response:
                    "Sorry, I couldn't understand."
            });
        }

        return jsonMatch[0];

    } catch (error) {

        console.log(
            "Groq Error:",
            error.response?.data || error.message
        );

        return JSON.stringify({

            type: "general",

            userInput: command,

            response:
                "Sorry, something went wrong."
        });
    }
};

export default groqResponse;
