import axios from "axios";
import { normalizeSpeechText } from "../utils/audioHelpers";
import {
  checkCalendarAvailability,
  createBirthdayEvent,
  createCalendarEvent,
  createReminderEvent,
  deleteCalendarEvent,
  deleteCalendarEventsByRange,
  getEventsByRange,
  getNextEvent,
  getTodayEvents,
  getWeekEvents,
  searchCalendarEvents,
  updateCalendarEvent,
} from "./calendarService";
import {
  CALENDAR_INTENTS,
  describeCalendarIntent,
  isConfirmationResponse,
  parseCalendarIntent,
} from "./calendarIntentService";
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

  const mentionsDevice = /\b(laptop|computer|pc|system|windows)\b/.test(command);
  const directPowerCommand = /^(sleep|suspend|restart|reboot|shutdown|shut down|power off|turn off)$/.test(command);

  if (mentionsDevice || directPowerCommand) {
    if (/\b(shut down|shutdown|power off|turn off)\b/.test(command)) {
      return {
        type: "system-power",
        action: "shutdown",
        userInput: command,
        response: "Are you sure you want to shut down your laptop?",
      };
    }

    if (/\b(restart|reboot)\b/.test(command)) {
      return {
        type: "system-power",
        action: "restart",
        userInput: command,
        response: "Are you sure you want to restart your laptop?",
      };
    }

    if (/\b(sleep|suspend)\b/.test(command)) {
      return {
        type: "system-power",
        action: "sleep",
        userInput: command,
        response: "Are you sure you want to put your laptop to sleep?",
      };
    }
  }

  if (/\b(shutdown listening|sleep|go to sleep|standby|so jao|sona)\b/.test(command) || /सो जाओ|स्लीप/.test(command)) {
    return { type: "sleep-assistant", userInput: command, response: "Going quiet." };
  }

  if (/\b(end conversation|end chat|finish conversation|close conversation|that is all|that's all|goodbye|bye|we are done|conversation over|bas itna hi|alvida)\b/.test(command)) {
    return { type: "end-conversation", userInput: command, response: "Conversation ended. Say my name when you need me again." };
  }

  if (isInterruptCommand(command)) {
    return { type: "cancel-command", userInput: command, response: "Stopped." };
  }

  if (/\b(next|skip|next song|skip song|next track|agla|agli)\b/.test(command) || /अगला|अगली/.test(command)) {
    return { type: "next-media", userInput: command, response: "Playing the next song." };
  }

  if (/\b(pause|rok do|roko)\b/.test(command) || /पॉज|रोक/.test(command)) {
    return { type: "pause-media", userInput: command, response: "Paused." };
  }

  if (/^(resume|continue)$/.test(command) || /\b(resume|continue|chalu|chalao|jaari)\b/.test(command) || /चालू|चलाओ|जारी/.test(command)) {
    return { type: "resume-media", userInput: command, response: "Resuming." };
  }

  if (isOpenYoutubeOnly(command)) {
    return { type: "open-youtube", userInput: "youtube", response: "Opening YouTube." };
  }

  if (/^(please\s+)?(open|launch|start)\s+(my\s+)?(google\s+)?(calendar|calender)(\s+(app|site|website))?$/.test(command)) {
    return { type: "open-google-calendar", userInput: "google calendar", response: "Opening Google Calendar." };
  }

  if (/\b(open|launch|start|khol|kholo)\s+(chrome|google chrome)\b/.test(command) || /क्रोम.*खोल|खोल.*क्रोम/.test(command)) {
    return { type: "open-chrome", userInput: "chrome", response: "Opening Chrome." };
  }

  if (/\b(open|launch|start|khol|kholo)\s+(vs code|vscode|visual studio code)\b/.test(command) || /वी एस कोड.*खोल|खोल.*वी एस कोड/.test(command)) {
    return { type: "open-vscode", userInput: "vs code", response: "Opening VS Code." };
  }

  if (/\b(open|launch|start|khol|kholo)\s+notepad\b/.test(command) || /नोटपैड.*खोल|खोल.*नोटपैड/.test(command)) {
    return { type: "open-notepad", userInput: "notepad", response: "Opening Notepad." };
  }

  if (/\b(open|launch|start|khol|kholo)\s+(calculator|calc)\b/.test(command) || /कैलकुलेटर.*खोल|खोल.*कैलकुलेटर/.test(command)) {
    return { type: "calculator-open", userInput: "calculator", response: "Opening Calculator." };
  }

  if (/\bsearch\s+(google\s+)?for\b/.test(command) || /\b(search karo|dhundo)\b/.test(command) || /गूगल|सर्च|ढूंढ/.test(command)) {
    const query = cleanQuery(command, [/\bsearch\s+(google\s+)?for\b/g, /\b(search karo|dhundo)\b/g, /गूगल|सर्च|ढूंढो?|करो/g]);

    return {
      type: "google-search",
      userInput: query,
      response: `Searching Google for ${formatTarget(query)}.`,
    };
  }

  if (/\b(open|launch|start|khol|kholo)\s+instagram\b/.test(command)) {
    return { type: "instagram-open", userInput: "instagram", response: "Opening Instagram." };
  }

  if (/\b(open|launch|start|khol|kholo)\s+facebook\b/.test(command)) {
    return { type: "facebook-open", userInput: "facebook", response: "Opening Facebook." };
  }

  if (/\b(weather|temperature|forecast|mausam)\b/.test(command) || /मौसम|तापमान/.test(command)) {
    return { type: "weather-show", userInput: "weather", response: "Opening weather." };
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

  if (/\b(play|plau|listen to|put on|chalao|lagao)\b/.test(command) || /चलाओ|लगाओ|गाना/.test(command)) {
    const query = cleanQuery(command, [/\b(play|plau|listen to|put on|chalao|lagao)\b/g, /\b(song|music|track|gaana|gana)\b/g, /चलाओ|लगाओ|गाना/g]);
    const musicQuery = query || "music";

    return {
      type: "play-music",
      userInput: musicQuery,
      response: `Playing ${formatTarget(musicQuery)} on YouTube Music.`,
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

  if (type === "youtube-search" || type === "youtube-play" || type === "play-music" || type === "youtube-music-play") {
    return false;
  }

  if (type === "open-youtube") {
    window.open("https://www.youtube.com", "_blank");
    return true;
  }

  if (type === "open-google-calendar") {
    window.open("https://calendar.google.com/calendar/u/0/r", "_blank");
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

const formatEventTime = (event = {}) => {
  const value = event.start?.dateTime || event.start?.date;

  if (!value) return "";

  if (event.start?.date) return "all day";

  return new Intl.DateTimeFormat("en-IN", {
    timeStyle: "short",
  }).format(new Date(value));
};

const summarizeEvents = (events = [], label = "calendar") => {
  if (!events.length) return `You have nothing on your ${label}.`;

  return events
    .slice(0, 5)
    .map((event) => `${event.summary || "Untitled event"} at ${formatEventTime(event)}`)
    .join(". ");
};

const rangeLabel = (payload = {}) => {
  if (payload.timeMin) {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(new Date(payload.timeMin));
  }

  if (payload.range === "tomorrow") return "tomorrow";
  if (payload.range === "week") return "this week";
  if (payload.range === "month") return "this month";
  return "today";
};

const getCalendarErrorMessage = (error) => {
  if (error.response?.status === 401 || error.response?.data?.code === "GOOGLE_CALENDAR_NOT_CONNECTED") {
    return "Google Calendar is not connected yet. Use the calendar panel to connect it first.";
  }

  if (error.response?.status === 403) {
    return "Google Calendar permission is missing. Please reconnect Calendar and allow calendar access.";
  }

  return error.response?.data?.message || "I had trouble with Google Calendar.";
};

export { CALENDAR_INTENTS, isConfirmationResponse, parseCalendarIntent };

export const prepareCalendarAction = async ({ intent, serverUrl, signal }) => {
  if (!intent) return null;

  if (intent.type === CALENDAR_INTENTS.DELETE_EVENT || intent.type === CALENDAR_INTENTS.UPDATE_EVENT) {
    const targetEvent = intent.payload?.targetNext
      ? await getNextEvent(serverUrl, signal)
      : (await searchCalendarEvents(
          serverUrl,
          {
            q: intent.payload?.query || "",
            timeMin: intent.payload?.timeMin,
            timeMax: intent.payload?.timeMax,
            maxResults: 5,
          },
          signal
        ))[0];

    if (!targetEvent) {
      return {
        ready: false,
        response: "I could not find a matching calendar event.",
      };
    }

    const preparedIntent = {
      ...intent,
      payload: {
        ...intent.payload,
        eventId: targetEvent.id,
        event: targetEvent,
      },
    };

    if (!intent.needsConfirmation) {
      return {
        ready: true,
        confirmation: null,
        intent: preparedIntent,
      };
    }

    return {
      ready: true,
      confirmation: {
        intent: preparedIntent,
        message:
          intent.type === CALENDAR_INTENTS.DELETE_EVENT
            ? `I found ${targetEvent.summary || "this event"} at ${formatEventTime(targetEvent)}. Should I delete it?`
            : `I found ${targetEvent.summary || "this event"} at ${formatEventTime(targetEvent)}. Should I update it?`,
      },
    };
  }

  if (intent.type === CALENDAR_INTENTS.DELETE_DAY_EVENTS) {
    if (intent.payload?.needsDate) {
      return {
        ready: false,
        response: "Which day should I clear? Say something like delete all events today, tomorrow, or on Friday.",
      };
    }

    const events = await getEventsByRange(
      serverUrl,
      {
        range: intent.payload?.range || "today",
        timeMin: intent.payload?.timeMin,
        timeMax: intent.payload?.timeMax,
        maxResults: 50,
      },
      signal
    );

    if (!events.length) {
      return {
        ready: false,
        response: `I found no events on your calendar for ${rangeLabel(intent.payload)}.`,
      };
    }

    return {
      ready: true,
      confirmation: {
        intent: {
          ...intent,
          payload: {
            ...intent.payload,
            eventCount: events.length,
          },
        },
        message: `I found ${events.length} event${events.length === 1 ? "" : "s"} for ${rangeLabel(intent.payload)}. Should I delete all of them?`,
      },
    };
  }

  if (intent.needsConfirmation) {
    return {
      ready: true,
      confirmation: {
        intent,
        message: describeCalendarIntent(intent),
      },
    };
  }

  return {
    ready: true,
    confirmation: null,
  };
};

export const executeCalendarIntent = async ({ intent, serverUrl, signal }) => {
  try {
    switch (intent.type) {
      case CALENDAR_INTENTS.CREATE_EVENT: {
        const event = await createCalendarEvent(serverUrl, intent.payload, signal);

        return {
          event,
          response: `Done. I added ${event.summary || "the event"} to your Google Calendar.`,
        };
      }

      case CALENDAR_INTENTS.CREATE_BIRTHDAY: {
        const event = await createBirthdayEvent(serverUrl, intent.payload, signal);

        return {
          event,
          response: `Done. I added ${event.summary || "the birthday"} every year.`,
        };
      }

      case CALENDAR_INTENTS.CREATE_REMINDER: {
        const event = await createReminderEvent(serverUrl, intent.payload, signal);

        return {
          event,
          response: `Done. I added the reminder ${event.summary || ""}.`.trim(),
        };
      }

      case CALENDAR_INTENTS.VIEW_TODAY_EVENTS: {
        const events = await getTodayEvents(serverUrl, signal);

        return {
          events,
          response: summarizeEvents(events, "calendar today"),
        };
      }

      case CALENDAR_INTENTS.VIEW_TOMORROW_EVENTS: {
        const events = await getEventsByRange(serverUrl, { range: "tomorrow", maxResults: 10 }, signal);

        return {
          events,
          response: summarizeEvents(events, "calendar tomorrow"),
        };
      }

      case CALENDAR_INTENTS.VIEW_WEEK_EVENTS: {
        const events = await getWeekEvents(serverUrl, signal);

        return {
          events,
          response: summarizeEvents(events, "calendar this week"),
        };
      }

      case CALENDAR_INTENTS.VIEW_MONTH_EVENTS: {
        const events = await getEventsByRange(serverUrl, { range: "month", maxResults: 20 }, signal);

        return {
          events,
          response: summarizeEvents(events, "calendar this month"),
        };
      }

      case CALENDAR_INTENTS.VIEW_NEXT_EVENT: {
        const event = await getNextEvent(serverUrl, signal);

        return {
          event,
          response: event
            ? `Your next event is ${event.summary || "untitled"} at ${formatEventTime(event)}.`
            : "You do not have an upcoming event.",
        };
      }

      case CALENDAR_INTENTS.SEARCH_EVENT: {
        const events = await searchCalendarEvents(
          serverUrl,
          {
            q: intent.payload?.query || "",
            timeMin: intent.payload?.timeMin,
            timeMax: intent.payload?.timeMax,
            maxResults: 10,
          },
          signal
        );

        return {
          events,
          response: summarizeEvents(events, "search results"),
        };
      }

      case CALENDAR_INTENTS.UPDATE_EVENT: {
        const event = await updateCalendarEvent(
          serverUrl,
          intent.payload.eventId,
          {
            ...intent.payload,
            event: undefined,
          },
          signal
        );

        return {
          event,
          response: `Done. I updated ${event.summary || "the event"}.`,
        };
      }

      case CALENDAR_INTENTS.DELETE_EVENT: {
        await deleteCalendarEvent(serverUrl, intent.payload.eventId, signal);

        return {
          response: "Done. I deleted the event.",
        };
      }

      case CALENDAR_INTENTS.DELETE_DAY_EVENTS: {
        const data = await deleteCalendarEventsByRange(
          serverUrl,
          {
            range: intent.payload?.range || "today",
            timeMin: intent.payload?.timeMin,
            timeMax: intent.payload?.timeMax,
          },
          signal
        );

        return {
          deletedEvents: data,
          response: (() => {
            if (data.remainingCount > 0 || data.failedCount > 0) {
              return `I tried to delete the events, but ${data.remainingCount || data.failedCount} still remain.`;
            }

            if (data.deletedCount === 0) {
              return `I found no events to delete for ${rangeLabel(intent.payload)}.`;
            }

            return `Done. I deleted ${data.deletedCount} event${data.deletedCount === 1 ? "" : "s"} for ${rangeLabel(intent.payload)}.`;
          })(),
        };
      }

      case CALENDAR_INTENTS.CHECK_AVAILABILITY: {
        const data = await checkCalendarAvailability(serverUrl, intent.payload, signal);

        return {
          availability: data,
          response: data.free
            ? "Yes, you are free during that time."
            : "No, you have something scheduled during that time.",
        };
      }

      default:
        return {
          response: "I did not understand that calendar command.",
        };
    }
  } catch (error) {
    return {
      error,
      response: getCalendarErrorMessage(error),
    };
  }
};

export const processCommand = async ({
  command,
  serverUrl,
  history,
  systemPrompt,
  language,
  signal,
}) => {
  const localIntent = classifyLocalIntent(command);

  if (import.meta.env.DEV) {
    console.debug("[assistant command]", {
      command,
      localIntent,
    });
  }

  const response = await axios.post(
    `${serverUrl}/api/user/asktoassistant`,
    {
      command,
      history,
      systemPrompt,
      language,
      localIntent,
    },
    {
      withCredentials: true,
      signal,
    }
  );

  return response.data;
};
