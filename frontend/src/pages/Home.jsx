import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LogOut, Mic, Send, Settings } from "lucide-react";
import { userDataContext } from "../context/UserContext";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } =
    useContext(userDataContext);

  const navigate = useNavigate();
  const synth = window.speechSynthesis;

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${userData?.name || "there"}! I'm ${
        userData?.assistantName || "your assistant"
      }. You can type or say my name to talk to me.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);
  const historyRef = useRef([]);
  const endRef = useRef(null);

  const assistantName = userData?.assistantName || "Assistant";
  const userName = userData?.name || "there";
  const latestAssistantMessage =
    [...messages].reverse().find((message) => message.role === "assistant")
      ?.content || "";

  const buildSystemPrompt = () =>
    `
You are ${assistantName}, a helpful voice and chat assistant.

User profile:
- Name: ${userData?.name || "Unknown"}
- Email: ${userData?.email || "Unknown"}

Rules:
- Reply in short, natural sentences because responses may be spoken aloud.
- Remember the conversation history and refer back when useful.
- If the user asks for an app, website, search, YouTube, date, or time action, classify it with the right action type.
- For music, always use YouTube Music.
- If you do not know something, say so honestly.
`.trim();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addMessage = (role, content) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop();
      isRecognitionActiveRef.current = false;
    } catch {
      // Browser speech recognition can throw when it is already stopped.
    }
  };

  const startRecognition = () => {
    if (!recognitionRef.current || isRecognitionActiveRef.current) return;

    try {
      recognitionRef.current.start();
      isRecognitionActiveRef.current = true;
    } catch (error) {
      console.log(error);
    }
  };

  const speak = (text) => {
    if (!text) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    isSpeakingRef.current = true;
    utterance.onstart = stopRecognition;
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setTimeout(startRecognition, 600);
    };

    synth.speak(utterance);
  };

  const cleanMusicQuery = (text = "") =>
    text
      .replace(new RegExp(`\\b${assistantName}\\b`, "gi"), "")
      .replace(/\b(on|in)\s+youtube\s+music\b/gi, "")
      .replace(/\bplay\b/gi, "")
      .replace(/\bsong\b/gi, "")
      .trim();

  const openYoutubeMusic = (song) => {
    const query = cleanMusicQuery(song);

    if (!query) {
      return "Tell me which song you want me to play.";
    }

    window.open(
      `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
      "_blank"
    );

    return `Opening ${query} on YouTube Music.`;
  };

  const runBrowserAction = async ({ type, userInput }, originalMessage = "") => {
    const actionInput = userInput || originalMessage;
    const encodedInput = encodeURIComponent(actionInput || "");

    if (type === "google-search") {
      window.open(`https://www.google.com/search?q=${encodedInput}`, "_blank");
    }

    if (type === "youtube-search" || type === "youtube-play") {
      window.open(
        `https://www.youtube.com/results?search_query=${encodedInput}`,
        "_blank"
      );
    }

    if (type === "play-music" || type === "youtube-music-play") {
      return openYoutubeMusic(actionInput);
    }

    if (type === "open-youtube") {
      window.open("https://www.youtube.com", "_blank");
    }

    if (type === "calculator-open") {
      window.open("https://www.google.com/search?q=calculator", "_blank");
    }

    if (type === "instagram-open") {
      window.open("https://www.instagram.com", "_blank");
    }

    if (type === "facebook-open") {
      window.open("https://www.facebook.com", "_blank");
    }

    if (type === "weather-show") {
      window.open("https://www.google.com/search?q=weather", "_blank");
    }

    return "";
  };

  const askAssistant = async (message) => {
    const previousHistory = historyRef.current.slice(-20);
    const nextHistory = [
      ...previousHistory,
      { role: "user", content: message },
    ].slice(-20);

    const data = await getGeminiResponse(
      message,
      previousHistory,
      buildSystemPrompt()
    );

    const response =
      data?.response || "Sorry, I could not understand that properly.";

    historyRef.current = [
      ...nextHistory,
      { role: "assistant", content: response },
    ].slice(-20);

    const actionMessage = await runBrowserAction(data || {}, message);

    if (actionMessage) {
      historyRef.current = [
        ...nextHistory,
        { role: "assistant", content: actionMessage },
      ].slice(-20);

      return actionMessage;
    }

    return response;
  };

  const sendMessage = async (text = input) => {
    const message = text.trim();
    if (!message || loading) return;

    addMessage("user", message);
    setInput("");

    setLoading(true);

    try {
      const response = await askAssistant(message);
      addMessage("assistant", response);
      speak(response);
    } catch (error) {
      console.log(error);
      addMessage("assistant", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceCommand = async (text) => {
    const wakeWord = assistantName.toLowerCase();

    if (!text.includes(wakeWord)) {
      if (text.includes("open google")) {
        window.open("https://www.google.com", "_blank");
        speak("Opening Google.");
      }

      if (text.includes("open youtube")) {
        window.open("https://www.youtube.com", "_blank");
        speak("Opening YouTube.");
      }

      if (text.startsWith("play ")) {
        await sendMessage(text);
      }

      return;
    }

    const command = text.replace(wakeWord, "").trim();

    if (!command) {
      speak(`Yes, ${userName}?`);
      return;
    }

    await sendMessage(command);
  };

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setUserData(null);
      navigate("/signin");
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setListening(true);
      isRecognitionActiveRef.current = true;
    };

    recognition.onend = () => {
      setListening(false);
      isRecognitionActiveRef.current = false;

      if (!isSpeakingRef.current) {
        setTimeout(startRecognition, 900);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      isRecognitionActiveRef.current = false;

      if (!isSpeakingRef.current) {
        setTimeout(startRecognition, 1200);
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      handleVoiceCommand(transcript);
    };

    recognitionRef.current = recognition;

    const greetAndStart = () => {
      speak(`Hello ${userName}. Say ${assistantName} to wake me up.`);
      startRecognition();
    };

    document.addEventListener("click", greetAndStart, { once: true });

    return () => {
      document.removeEventListener("click", greetAndStart);
      stopRecognition();
      synth.cancel();
    };
  }, [assistantName, userName]);

  return (
    <div className="relative flex h-screen w-full flex-col items-center overflow-hidden bg-gradient-to-t from-black to-[#02023d] px-4 text-white">
      <div className="absolute right-4 top-4 flex gap-3 sm:right-5 sm:top-5">
        <button
          aria-label="Customize assistant"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 sm:h-auto sm:w-auto sm:px-5 sm:py-3"
          onClick={() => navigate("/customize")}
        >
          <Settings size={20} />
          <span className="ml-2 hidden font-semibold sm:inline">Customize</span>
        </button>

        <button
          aria-label="Logout"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 sm:h-auto sm:w-auto sm:px-5 sm:py-3"
          onClick={handleLogOut}
        >
          <LogOut size={20} />
          <span className="ml-2 hidden font-semibold sm:inline">Logout</span>
        </button>
      </div>

      <main className="flex min-h-0 w-full max-w-[760px] flex-1 flex-col items-center justify-center gap-3 pt-20 pb-28 sm:gap-4 sm:pt-20 sm:pb-24">
        <div className="h-[220px] w-[185px] overflow-hidden rounded-3xl border border-white/20 shadow-2xl sm:h-[280px] sm:w-[235px] lg:h-[300px] lg:w-[250px]">
          <img
            alt={assistantName}
            className="h-full w-full object-cover"
            src={userData?.assistantImage}
          />
        </div>

        <div className="flex max-w-full flex-col items-center gap-1 text-center">
          <h1 className="max-w-[90vw] break-words text-2xl font-bold leading-tight text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.28)] sm:max-w-[560px] sm:text-3xl">
            {assistantName}
          </h1>
          <p className="text-sm font-medium text-white/65">
            {listening ? "Listening..." : `Say "${assistantName}" to wake me`}
          </p>
        </div>

        <h2 className="min-h-[58px] max-w-[700px] px-2 text-center text-base font-light leading-7 text-white/95 sm:min-h-[72px] sm:text-lg sm:leading-8">
          {loading ? "Thinking..." : latestAssistantMessage}
        </h2>

        <div className="flex h-[44px] items-center justify-center">
          {listening && (
            <div className="flex h-[40px] items-end gap-2">
              <span className="h-3 w-2 animate-bounce rounded-full bg-white" />
              <span
                className="h-6 w-2 animate-bounce rounded-full bg-white"
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className="h-10 w-2 animate-bounce rounded-full bg-white"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="h-6 w-2 animate-bounce rounded-full bg-white"
                style={{ animationDelay: "0.3s" }}
              />
              <span
                className="h-3 w-2 animate-bounce rounded-full bg-white"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          )}
        </div>

        <div ref={endRef} />
      </main>

      <footer className="absolute bottom-4 left-1/2 flex w-[calc(100%-32px)] max-w-[720px] -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-white/95 p-2 shadow-2xl">
        <input
          className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-3 text-sm text-black outline-none placeholder:text-slate-500"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder={`Ask ${assistantName} anything...`}
          value={input}
        />
        <button
          aria-label="Send message"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-white transition hover:bg-slate-800"
          onClick={() => sendMessage()}
        >
          <Send size={18} />
        </button>
        <button
          aria-label="Start voice listening"
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition ${
            listening
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={startRecognition}
        >
          <Mic size={18} />
        </button>
      </footer>
    </div>
  );


}

export default Home;
