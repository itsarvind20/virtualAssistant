import axios from "axios";
import { normalizeSpeechText } from "../utils/audioHelpers";
import { isInterruptCommand } from "./interruptService";

const cleanQuery = (text = "", patterns = []) =>
  patterns
    .reduce((value, pattern) => value.replace(pattern, ""), text)
    .replace(/\s+/g, " ")
    .trim();

const formatTarget = (text = "", fallback = "that") => text.trim() || fallback;

const isOpenYoutubeOnly = (command = "") =>
  /^(please\s+)?(open|launch|start)\s+(youtube|you tube)(\s+(app|site|website))?$/.test(command);

const isYoutubeVideoCommand = (command = "") =>
  (
    /\b(search|find|play|playing|show)\b.*\b(youtube|you tube)\b/.test(command) ||
    /\b(youtube|you tube)\b.*\b(search|find|play|playing|show)\b/.test(command) ||
    (/\b(youtube|you tube)\b/.test(command) && /\b(video|videos)\b/.test(command))
  ) &&
  !/\byoutube music\b/.test(command);

export const classifyLocalIntent = (text = "") => {
  const command = normalizeSpeechText(text);

  if (!command) {
    return { type: "empty", userInput: "", response: "I did not hear a command." };
  }

  if (/\b(shutdown listening|sleep|go to sleep|standby)\b/.test(command)) {
    return { type: "sleep-assistant", userInput: command, response: "Going quiet." };
  }

  if (/\b(end conversation|end chat|finish conversation|close conversation|that is all|that's all|goodbye|bye|we are done|conversation over)\b/.test(command)) {
    return { type: "end-conversation", userInput: command, response: "Conversation ended. Say my name when you need me again." };
  }

  if (isInterruptCommand(command)) {
    return { type: "cancel-command", userInput: command, response: "Stopped." };
  }

  if (/\b(next|skip|next song|skip song|next track)\b/.test(command)) {
    return { type: "next-media", userInput: command, response: "Playing the next song." };
  }

  if (/\bpause\b/.test(command)) {
    return { type: "pause-media", userInput: command, response: "Paused." };
  }

  if (/^(play|resume|continue)$/.test(command) || /\b(resume|continue|play song|play music)\b/.test(command)) {
    return { type: "resume-media", userInput: command, response: "Resuming." };
  }

  if (isOpenYoutubeOnly(command)) {
    return { type: "open-youtube", userInput: "youtube", response: "Opening YouTube." };
  }

  if (/\b(open|launch|start)\s+(chrome|google chrome)\b/.test(command)) {
    return { type: "open-chrome", userInput: "chrome", response: "Opening Chrome." };
  }

  if (/\b(open|launch|start)\s+(vs code|vscode|visual studio code)\b/.test(command)) {
    return { type: "open-vscode", userInput: "vs code", response: "Opening VS Code." };
  }

  if (/\b(open|launch|start)\s+notepad\b/.test(command)) {
    return { type: "open-notepad", userInput: "notepad", response: "Opening Notepad." };
  }

  if (/\b(open|launch|start)\s+(calculator|calc)\b/.test(command)) {
    return { type: "calculator-open", userInput: "calculator", response: "Opening Calculator." };
  }

  if (/\bsearch\s+(google\s+)?for\b/.test(command)) {
    const query = cleanQuery(command, [/\bsearch\s+(google\s+)?for\b/g]);

    return {
      type: "google-search",
      userInput: query,
      response: `Searching Google for ${formatTarget(query)}.`,
    };
  }

  if (isYoutubeVideoCommand(command)) {
    const query = cleanQuery(command, [
      /\b(search|find|play|playing|open|show)\b/g,
      /\b(on|in)\s+(youtube|you tube)\b/g,
      /\b(youtube|you tube)\b/g,
      /\b(video|videos)\b/g,
      /\bfor\b/g,
    ]);

    return {
      type: "youtube-search",
      userInput: query,
      response: `Playing ${formatTarget(query, "the first result")} on YouTube.`,
    };
  }

  if (/\b(play|plau|listen to|put on)\b/.test(command)) {
    const query = cleanQuery(command, [/\b(play|plau|listen to|put on)\b/g, /\b(song|music|track)\b/g]);

    return {
      type: "play-music",
      userInput: query,
      response: `Playing ${formatTarget(query)} on YouTube Music.`,
    };
  }

  return null;
};

export const executeLocalBrowserAction = ({ type, userInput }) => {
  const encodedInput = encodeURIComponent(userInput || "");

  if (type === "google-search") {
    window.open(`https://www.google.com/search?q=${encodedInput}`, "_blank");
    return true;
  }

  if (type === "youtube-search" || type === "youtube-play") return true;

  if (type === "open-youtube") {
    window.open("https://www.youtube.com", "_blank");
    return true;
  }

  if (type === "instagram-open") {
    window.open("https://www.instagram.com", "_blank");
    return true;
  }

  if (type === "facebook-open") {
    window.open("https://www.facebook.com", "_blank");
    return true;
  }

  if (type === "weather-show") {
    window.open("https://www.google.com/search?q=weather", "_blank");
    return true;
  }

  return false;
};

export const processCommand = async ({
  command,
  serverUrl,
  history,
  systemPrompt,
  signal,
}) => {
  const localIntent = classifyLocalIntent(command);

  const response = await axios.post(
    `${serverUrl}/api/user/asktoassistant`,
    {
      command,
      history,
      systemPrompt,
      localIntent,
    },
    {
      withCredentials: true,
      signal,
    }
  );

  return response.data;
};
