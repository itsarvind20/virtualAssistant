import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";
import { exec } from "child_process";
import open from "open";

import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import groqResponse from "./groq.js"

const app = express();
const port = process.env.PORT || 3000;


// =========================
// MIDDLEWARE
// =========================

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


// =========================
// ROUTES
// =========================

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);



// =========================

// =========================
// AI ROUTE
// =========================

app.post("/ai", async (req, res) => {

    try {

        const { prompt, model } = req.body;

        if (!prompt) {

            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }


        // FIRST CHECK DESKTOP COMMANDS
        const desktopResponse = await executeDesktopCommand(prompt);


        // IF COMMAND FOUND
        if (desktopResponse) {

            return res.json({
                success: true,
                response: desktopResponse
            });
        }


        // OTHERWISE USE AI
        let response;
        
        response = await groqResponse(prompt);

        return res.json({
            success: true,
            response
        });

    } catch (error) {

        console.error("AI Route Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});


// =========================
// SERVER START
// =========================

app.listen(port, async () => {

    try {

        await connectDb();

        console.log(`Server started on port ${port}`);

    } catch (error) {

        console.log("Database Connection Error:", error);
    }
});