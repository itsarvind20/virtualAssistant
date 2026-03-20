// import axios from "axios"
const geminiResponse = async (prompt)=> {
try{
    const result=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",{
    method : 'POST',
    headers : {
        "Content-Type" : "application/json",
        "x-goog-api-key" :"AIzaSyCXMg4g3zMUPVWsu_-x7gC4m4c3EQloYYs"
    },
    body : JSON.stringify({
    "contents": [
      {
        "parts": [
          {
            "text": prompt
          }
        ]
      }
    ]
  })
})
    const data = await result.json()
    console.log(data.candidates[0].content.parts[0].text)
    return data.candidates[0].content.parts[0].text
}catch (error) {
    console.log(error)
}
    
}
geminiResponse("what is AI")
export default geminiResponse