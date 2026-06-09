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
  /\ba\b/g,
  /\ban\b/g,
  /\bthe\b/g,
];

const hindiCalendarPatterns = [
  [/\bआज\b/g, " today "],
  [/\bकल\b/g, " tomorrow "],
  [/\bपरसों\b/g, " day after tomorrow "],
  [/\bइवेंट\b/g, " event "],
  [/\bकार्यक्रम\b/g, " event "],
  [/\bमीटिंग\b/g, " meeting "],
  [/\bबैठक\b/g, " meeting "],
  [/\bटास्क\b/g, " task "],
  [/\bकाम\b/g, " task "],
  [/\bरिमाइंडर\b/g, " reminder "],
  [/\bयाद दिलाओ\b/g, " remind me "],
  [/\bजोड़ो\b/g, " add "],
  [/\bजोड़ो\b/g, " add "],
  [/\bबनाओ\b/g, " create "],
  [/\bशेड्यूल\b/g, " schedule "],
  [/\bदिखाओ\b/g, " show "],
  [/\bहटाओ\b/g, " delete "],
  [/\bमिटाओ\b/g, " delete "],
  [/\bअगली\b/g, " next "],
  [/\bअगला\b/g, " next "],
  [/\bहाँ\b/g, " yes "],
  [/\bहां\b/g, " yes "],
  [/\bनहीं\b/g, " no "],
  [/\bनही\b/g, " no "],
];

const applyHindiCalendarAliases = (text = "") =>
  hindiCalendarPatterns.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    String(text)
  );

const applyCalendarAliases = (text = "") =>
  applyHindiCalendarAliases(text)
    .replace(/\bcalender\b/g, " calendar ")
    .replace(/\bcalandar\b/g, " calendar ")
    .replace(/\bcalenda\b/g, " calendar ")
    .replace(/\bagenda\b/g, " calendar ")
    .replace(/\bappointment\b/g, " event ")
    .replace(/\bappointments\b/g, " events ")
    .replace(/\bto\s+do\b/g, " todo ");

const cleanText = (text = "") =>
  fillerPatterns
    .reduce((value, pattern) => value.replace(pattern, " "), normalizeSpeechText(applyCalendarAliases(text)))
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
      .replace(/\b(add|create|schedule|book|set up|make|put|block|event|calendar|meeting|meet|call|discussion|time|slot|google|link|on|at|from|to|with|for)\b/g, " ")
      .replace(/\bevery\s+(day|monday|tuesday|wednesday|thursday|friday|saturday|sunday|month|year)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  ) || "Meeting";
};

const reminderTitleFromCommand = (text = "") => {
  const withoutDate = removeChronoText(cleanText(text));

  return titleCase(
    withoutDate
      .replace(/\b(add|create|schedule|set|make|put|remind me to|remind|reminder|task|todo|me|to|at|on|every|calendar)\b/g, " ")
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
    .replace(/\b(search|find|show|cancel|delete|remove|move|reschedule|update|edit|change|meeting|event|reminder|calendar|with|my|next|to|from|at|on|called|named)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const isCalendarCommand = (text = "") => {
  const command = cleanText(text);

  return /\b(calendar|meeting|event|schedule|birthday|remind|reminder|task|todo|availability|available|free|busy|agenda|appointment)\b/.test(command) ||
    /\b(am i free|do i have time|what do i have|what is on|show my meetings|next meeting|next event|block time|put .* on calendar)\b/.test(command);
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

  if (/\b(am i free|am i available|available|availability|free tomorrow|free today|do i have time|any meetings|busy)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.CHECK_AVAILABILITY,
      payload: {
        naturalText: text,
        ...parseDateResult(command),
      },
      needsConfirmation: false,
    };
  }

  if (/\b(cancel|delete|remove)\b/.test(command) && /\b(event|meeting|reminder|calendar)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.DELETE_EVENT,
      payload: {
        query: searchQueryFromCommand(command),
        naturalText: text,
        targetNext: /\bnext\b/.test(command),
      },
      needsConfirmation: false,
    };
  }

  if (/\b(move|reschedule|update|edit|change|rename|add google meet|google meet link|meet link)\b/.test(command) && /\b(event|meeting|reminder|calendar|meet)\b/.test(command)) {
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

  if (/\bremind me\b|\breminder\b|\btask\b|\btodo\b|\bfollow up\b/.test(command)) {
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
      needsConfirmation: false,
    };
  }

  if (
    (
      /\b(add|create|schedule|book|set up|make|put)\b/.test(command) &&
      /\b(event|meeting|calendar|discussion|call)\b/.test(command)
    ) ||
    /\b(block time|block .* calendar|put .* on calendar)\b/.test(command)
  ) {
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
      needsConfirmation: false,
    };
  }

  if (
    /\b(today|schedule today|calendar today|on calendar today|what is on today|what do i have today|meetings today|events today|show today)\b/.test(command) &&
    /\b(calendar|schedule|meeting|event|what is on|what do i have|show|meetings|events)\b/.test(command)
  ) {
    return {
      type: CALENDAR_INTENTS.VIEW_TODAY_EVENTS,
      payload: {},
      needsConfirmation: false,
    };
  }

  if (/\b(this week|week|meetings this week|events this week|weekly agenda)\b/.test(command) && /\b(calendar|schedule|meeting|event|show|agenda|meetings|events)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.VIEW_WEEK_EVENTS,
      payload: {},
      needsConfirmation: false,
    };
  }

  if (/\b(this month|month|monthly agenda)\b/.test(command) && /\b(calendar|schedule|meeting|event|show|agenda|meetings|events)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.VIEW_MONTH_EVENTS,
      payload: { range: "month" },
      needsConfirmation: false,
    };
  }

  if (/\b(next meeting|next event|next reminder|next on calendar|what is next|upcoming meeting|upcoming event)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.VIEW_NEXT_EVENT,
      payload: {},
      needsConfirmation: false,
    };
  }

  if (/\b(search|find|show|look for)\b/.test(command) && /\b(calendar|meeting|event|reminder)\b/.test(command)) {
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
