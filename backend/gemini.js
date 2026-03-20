const geminiResponse = async (command,assistantName,userName) => {
  try {
const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}. 
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond with a JSON object like this:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month"|"calculator-open" | "instagram-open" |"facebook-open" |"weather-show"
  ,
  "userInput": "<original user input>" {only remove your name from userinput if exists} and agar kisi ne google ya youtube pe kuch search karne ko bola hai to userInput me only bo search baala text jaye,

  "response": "<a short spoken response to read out loud to the user>"
}

Instructions:
- "type": determine the intent of the user.
- "userinput": original sentence the user spoke.
- "response": A short voice-friendly reply, e.g., "Sure, playing it now", "Here's what I found", "Today is Tuesday", etc.

Type meanings:
- "general": if it's a factual or informational question. aur agar koi aisa question puchta hai jiska answer tume pata hai usko bhi general ki category me rakho bas short answer dena
- "google-search": if user wants to search something on Google .
- "youtube-search": if user wants to search something on YouTube.
- "youtube-play": if user wants to directly play a video or song.
- "calculator-open": if user wants to  open a calculator .
- "instagram-open": if user wants to  open instagram .
- "facebook-open": if user wants to open facebook.
-"weather-show": if user wants to know weather
- "get-time": if user asks for current time.
- "get-date": if user asks for today's date.
- "get-day": if user asks what day it is.
- "get-month": if user asks for the current month.

Important:
- Use ${userName} agar koi puche tume kisne banaya 
- Only respond with the JSON object, nothing else.


now your userInput- ${command}
`;
    const result = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
       {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": "AIzaSyBaD9fDFe9bLttHzlpmxftbClUdwpNJ3zs",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await result.json();

    // 🔍 Debug: see full response
    // console.log("API Response:", JSON.stringify(data, null, 2));

    // ❌ Handle API error
    if (data.error) {
      throw new Error(data.error.message);
    }

    // ✅ Safe access
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";

  } catch (error) {
    console.log("Error:", error.message);
    return "Error occurred";
  }
};
export default geminiResponse
