import * as chrono from "chrono-node";
import { normalizeSpeechText } from "../utils/audioHelpers";

export const CALENDAR_INTENTS = {
  CREATE_EVENT: "CREATE_EVENT",
  CREATE_BIRTHDAY: "CREATE_BIRTHDAY",
  CREATE_REMINDER: "CREATE_REMINDER",
  VIEW_TODAY_EVENTS: "VIEW_TODAY_EVENTS",
  VIEW_WEEK_EVENTS: "VIEW_WEEK_EVENTS",
  VIEW_MONTH_EVENTS: "VIEW_MONTH_EVENTS",
  VIEW_NEXT_EVENT: "VIEW_NEXT_EVENT",
  SEARCH_EVENT: "SEARCH_EVENT",
  UPDATE_EVENT: "UPDATE_EVENT",
  DELETE_EVENT: "DELETE_EVENT",
  CHECK_AVAILABILITY: "CHECK_AVAILABILITY",
};

const fillerPatterns = [
  /\bplease\b/g,
  /\bcan you\b/g,
  /\bcould you\b/g,
  /\bwould you\b/g,
  /\bmy\b/g,
];

const cleanText = (text = "") =>
  fillerPatterns
    .reduce((value, pattern) => value.replace(pattern, " "), normalizeSpeechText(text))
    .replace(/\s+/g, " ")
    .trim();

const removeChronoText = (text = "") => {
  const results = chrono.parse(text, new Date(), { forwardDate: true });

  return results
    .reduce((value, result) => value.replace(result.text, " "), text)
    .replace(/\b(today|tomorrow|tonight|morning|afternoon|evening|night|this week|next week|this month|weekend)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const parseDateResult = (text = "", useLast = false) => {
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  const result = useLast ? results.at(-1) : results[0];

  if (!result) return null;

  const start = result.start.date();
  const end = result.end?.date?.() || new Date(start.getTime() + 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    matchedText: result.text,
    allDay: !result.start.isCertain("hour"),
  };
};

const detectRecurrence = (text = "") => {
  const command = cleanText(text);

  if (/\bevery\s+day\b|\bdaily\b/.test(command)) return ["RRULE:FREQ=DAILY"];
  if (/\bevery\s+monday\b/.test(command)) return ["RRULE:FREQ=WEEKLY;BYDAY=MO"];
  if (/\bevery\s+tuesday\b/.test(command)) return ["RRULE:FREQ=WEEKLY;BYDAY=TU"];
  if (/\bevery\s+wednesday\b/.test(command)) return ["RRULE:FREQ=WEEKLY;BYDAY=WE"];
  if (/\bevery\s+thursday\b/.test(command)) return ["RRULE:FREQ=WEEKLY;BYDAY=TH"];
  if (/\bevery\s+friday\b/.test(command)) return ["RRULE:FREQ=WEEKLY;BYDAY=FR"];
  if (/\bevery\s+saturday\b/.test(command)) return ["RRULE:FREQ=WEEKLY;BYDAY=SA"];
  if (/\bevery\s+sunday\b/.test(command)) return ["RRULE:FREQ=WEEKLY;BYDAY=SU"];
  if (/\bevery\s+month\b|\bmonthly\b/.test(command)) return ["RRULE:FREQ=MONTHLY"];
  if (/\bevery\s+year\b|\byearly\b|\bannually\b/.test(command)) return ["RRULE:FREQ=YEARLY"];

  return [];
};

const extractAttendees = (text = "") => {
  const emailMatches = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];

  return emailMatches.map((email) => email.trim());
};

const titleCase = (text = "") =>
  text
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

const eventTitleFromCommand = (text = "") => {
  const withoutDate = removeChronoText(cleanText(text));

  return titleCase(
    withoutDate
      .replace(/\b(add|create|schedule|book|set up|event|calendar|meeting|meet|on|at|from|to|with)\b/g, " ")
      .replace(/\bevery\s+(day|monday|tuesday|wednesday|thursday|friday|saturday|sunday|month|year)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  ) || "Meeting";
};

const reminderTitleFromCommand = (text = "") => {
  const withoutDate = removeChronoText(cleanText(text));

  return titleCase(
    withoutDate
      .replace(/\b(remind me to|remind|reminder|me|to|at|on|every)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  ) || "Reminder";
};

const birthdayNameFromCommand = (text = "") => {
  const withoutDate = removeChronoText(cleanText(text));

  return titleCase(
    withoutDate
      .replace(/\b(add|create|birthday|bday|birth day|on|every|year|yearly|friend|friends)\b/g, " ")
      .replace(/\bs\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  ) || "Birthday";
};

const searchQueryFromCommand = (text = "") =>
  removeChronoText(cleanText(text))
    .replace(/\b(search|find|show|cancel|delete|remove|move|reschedule|update|edit|meeting|event|reminder|calendar|with|my|next|to|from|at|on)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const isCalendarCommand = (text = "") => {
  const command = cleanText(text);

  return /\b(calendar|meeting|event|schedule|birthday|remind|reminder|availability|available|free|busy)\b/.test(command) ||
    /\b(am i free|what is on|show my meetings|next meeting)\b/.test(command);
};

export const isConfirmationResponse = (text = "") => {
  const command = cleanText(text);

  if (/^(yes|yeah|yep|confirm|do it|create it|add it|delete it|update it|sure|ok|okay)\b/.test(command)) {
    return "confirm";
  }

  if (/^(no|nope|cancel|dont|do not|stop|never mind|nevermind)\b/.test(command)) {
    return "cancel";
  }

  return null;
};

export const parseCalendarIntent = (text = "") => {
  const command = cleanText(text);

  if (!isCalendarCommand(command)) return null;

  if (/\b(am i free|available|availability|free tomorrow|free today|busy)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.CHECK_AVAILABILITY,
      payload: {
        naturalText: text,
        ...parseDateResult(command),
      },
      needsConfirmation: false,
    };
  }

  if (/\b(today|schedule today|calendar today|on my calendar today)\b/.test(command) && /\b(calendar|schedule|meeting|event|what is on)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.VIEW_TODAY_EVENTS,
      payload: {},
      needsConfirmation: false,
    };
  }

  if (/\b(this week|week|meetings this week)\b/.test(command) && /\b(calendar|schedule|meeting|event|show)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.VIEW_WEEK_EVENTS,
      payload: {},
      needsConfirmation: false,
    };
  }

  if (/\b(this month|month)\b/.test(command) && /\b(calendar|schedule|meeting|event|show)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.VIEW_MONTH_EVENTS,
      payload: { range: "month" },
      needsConfirmation: false,
    };
  }

  if (/\b(next meeting|next event|next reminder|next on my calendar)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.VIEW_NEXT_EVENT,
      payload: {},
      needsConfirmation: false,
    };
  }

  if (/\b(cancel|delete|remove)\b/.test(command) && /\b(event|meeting|reminder|calendar)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.DELETE_EVENT,
      payload: {
        query: searchQueryFromCommand(command),
        naturalText: text,
      },
      needsConfirmation: true,
    };
  }

  if (/\b(move|reschedule|update|edit|change|add google meet|google meet link)\b/.test(command) && /\b(event|meeting|reminder|calendar|meet)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.UPDATE_EVENT,
      payload: {
        query: searchQueryFromCommand(command),
        naturalText: text,
        createMeet: /\bgoogle meet|meet link\b/.test(command),
        targetNext: /\bnext\b/.test(command),
        ...parseDateResult(command, true),
      },
      needsConfirmation: true,
    };
  }

  if (/\bbirthday\b|\bbday\b|\bbirth day\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.CREATE_BIRTHDAY,
      payload: {
        name: birthdayNameFromCommand(command),
        naturalText: text,
        recurrence: ["RRULE:FREQ=YEARLY"],
        reminders: [24 * 60],
      },
      needsConfirmation: true,
    };
  }

  if (/\bremind me\b|\breminder\b/.test(command)) {
    const parsedDate = parseDateResult(command);

    return {
      type: CALENDAR_INTENTS.CREATE_REMINDER,
      payload: {
        title: reminderTitleFromCommand(command),
        naturalText: text,
        recurrence: detectRecurrence(command),
        reminders: [0, 10],
        ...parsedDate,
      },
      needsConfirmation: true,
    };
  }

  if (/\b(add|create|schedule|book|set up)\b/.test(command) && /\b(event|meeting|calendar|discussion|call)\b/.test(command)) {
    const parsedDate = parseDateResult(command);

    return {
      type: CALENDAR_INTENTS.CREATE_EVENT,
      payload: {
        title: eventTitleFromCommand(command),
        naturalText: text,
        attendees: extractAttendees(text),
        recurrence: detectRecurrence(command),
        reminders: [10],
        createMeet: /\bgoogle meet|meet link\b/.test(command),
        ...parsedDate,
      },
      needsConfirmation: true,
    };
  }

  if (/\b(search|find|show)\b/.test(command) && /\b(calendar|meeting|event|reminder)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.SEARCH_EVENT,
      payload: {
        query: searchQueryFromCommand(command),
      },
      needsConfirmation: false,
    };
  }

  return null;
};

export const describeCalendarIntent = (intent) => {
  if (!intent) return "";

  const title = intent.payload?.title || intent.payload?.name || intent.payload?.query || "this event";

  if (intent.type === CALENDAR_INTENTS.CREATE_EVENT) {
    return `I understood: ${title}. Should I create this event?`;
  }

  if (intent.type === CALENDAR_INTENTS.CREATE_REMINDER) {
    return `I understood: reminder to ${title}. Should I create it?`;
  }

  if (intent.type === CALENDAR_INTENTS.CREATE_BIRTHDAY) {
    return `I understood: ${title} birthday every year. Should I add it?`;
  }

  if (intent.type === CALENDAR_INTENTS.UPDATE_EVENT) {
    return "I found this event. Should I update it?";
  }

  if (intent.type === CALENDAR_INTENTS.DELETE_EVENT) {
    return "I found this event. Should I delete it?";
  }

  return "Should I continue?";
};
