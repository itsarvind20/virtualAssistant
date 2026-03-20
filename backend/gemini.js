const geminiResponse = async (prompt) => {
  try {
    const result = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": "YOUR_API_KEY",
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
    console.log("API Response:", JSON.stringify(data, null, 2));

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