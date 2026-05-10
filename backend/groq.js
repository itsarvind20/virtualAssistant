import axios from "axios";

const groqResponse = async (
    command,
    assistantName,
    userName
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
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show" | "open-chrome" | "open-notepad" | "open-vscode" | "open-youtube" | "play-music" | "send-email",

  "userInput": "<clean user input>",

  "response": "<short voice-friendly response>"
}

Rules:

- Remove assistant name from userInput.
- For Google/YouTube search,
  keep ONLY search query in userInput.
- Keep response short and natural.
- If asked "who created you",
  mention ${userName}.
`;



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