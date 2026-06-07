import axios from "axios";
import { getAssistantAudioConstraints, normalizeSpeechText } from "../utils/audioHelpers";

const getSupportedMimeType = () => {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

export const createAudioCommandRecorder = () => {
  let mediaRecorder = null;
  let stream = null;
  let chunks = [];

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("Audio recording is not supported in this browser.");
    }

    if (mediaRecorder?.state === "recording") return;

    chunks = [];
    stream = await navigator.mediaDevices.getUserMedia(getAssistantAudioConstraints());
    const mimeType = getSupportedMimeType();
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data?.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.start(250);
  };

  const stop = () =>
    new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        mediaRecorder = null;
        chunks = [];
        resolve(blob.size > 0 ? blob : null);
      };

      mediaRecorder.stop();
    });

  const cancel = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    stream?.getTracks().forEach((track) => track.stop());
    mediaRecorder = null;
    stream = null;
    chunks = [];
  };

  return {
    start,
    stop,
    cancel,
    isRecording: () => mediaRecorder?.state === "recording",
  };
};

export const transcribeAudioCommand = async ({ serverUrl, audioBlob, language, signal }) => {
  if (!audioBlob) return "";

  const formData = new FormData();
  const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";

  formData.append("audio", audioBlob, `command.${extension}`);
  if (language) {
    formData.append("language", language);
  }

  const response = await axios.post(`${serverUrl}/api/user/transcribe`, formData, {
    withCredentials: true,
    signal,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return normalizeSpeechText(response.data?.transcript || "");
};
