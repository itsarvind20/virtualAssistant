import OpenAI from "openai";
import { toFile } from "openai/uploads";

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const normalizeTranscriptionLanguage = (language = "") => {
    const normalized = String(language).trim().toLowerCase();

    if (!normalized) return undefined;
    if (normalized.startsWith("hi")) return "hi";
    if (normalized.startsWith("en")) return "en";

    return normalized.split("-")[0];
};

export const transcribeCommand = async (req, res) => {

    try {

        if (!openai) {

            return res.status(503).json({
                transcript: "",
                provider: "none",
                message: "OPENAI_API_KEY is not configured"
            });
        }

        if (!req.file?.buffer) {

            return res.status(400).json({
                transcript: "",
                provider: "openai",
                message: "Audio file is required"
            });
        }

        const model =
            process.env.OPENAI_TRANSCRIBE_MODEL ||
            "gpt-4o-mini-transcribe";

        const prompt = [
            "This is a short voice command for a virtual desktop assistant.",
            "Expected commands include opening apps, playing music, searching Google, searching YouTube, pausing, stopping, resuming, and sleeping.",
            "The command may be spoken in English, Hindi, or Hinglish.",
            "Preserve app names and media names clearly."
        ].join(" ");
        const language = normalizeTranscriptionLanguage(req.body?.language);

        const audioFile = await toFile(
            req.file.buffer,
            req.file.originalname || "command.webm",
            {
                type: req.file.mimetype || "audio/webm"
            }
        );

        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model,
            ...(language ? { language } : {}),
            prompt,
            response_format: "json",
            temperature: 0
        });

        return res.json({
            transcript: transcription.text || "",
            provider: model
        });

    } catch (error) {

        console.log("Transcription Error:", error.response?.data || error.message);

        return res.status(500).json({
            transcript: "",
            provider: "openai",
            message: "Transcription failed"
        });
    }
};
