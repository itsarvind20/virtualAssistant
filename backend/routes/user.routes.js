import express from "express"
import multer from "multer"
import { transcribeCommand } from "../controllers/transcription.controllers.js"
import { getCurrentUser,updateAssistant,askToAssistant} from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"
const userRouter=express.Router()
const audioUpload=multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024
    }
})

userRouter.get("/current",isAuth,getCurrentUser)
userRouter.post("/update",isAuth,upload.single("assistantImage"),updateAssistant)
userRouter.post("/asktoassistant",isAuth,askToAssistant)
userRouter.post("/transcribe",isAuth,audioUpload.single("audio"),transcribeCommand)

export default userRouter
