import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import geminiResponse from "./gemini.js"



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

// ✅ FIXED ROUTE
app.get("/", async (req, res) => {
    try {
        const prompt = req.query.prompt;

        // 🔴 Check prompt
        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }

        const data = await geminiResponse(prompt);

        return res.json({
            success: true,
            response: data.json()
        });

    } catch (error) {
        console.log("Route Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});
app.listen(port,()=>{
    connectDb()
    console.log("server started")
})
