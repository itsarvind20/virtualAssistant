import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import geminiResponse from "./gemini.js"
import grokResponse from "./grok.js";


const app = express()
const port = process.env.PORT || 3000
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)

app.listen(port,()=>{
    connectDb()
    console.log("server started")
})

app.post("/ai", async (req, res) => {
  try {
    const { prompt, model } = req.body;

    let response;

    if (model === "grok") {
      response = await grokResponse(prompt);
    } else {
      // default → Gemini
      response = await geminiResponse(prompt);
    }

    res.json({ success: true, response });

  } catch (error) {
    console.error("AI Route Error:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});