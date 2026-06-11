import * as chrono from "chrono-node";
import { normalizeSpeechText } from "../utils/audioHelpers";

export const CALENDAR_INTENTS = {
  CREATE_EVENT: "CREATE_EVENT",
  CREATE_BIRTHDAY: "CREATE_BIRTHDAY",
  CREATE_REMINDER: "CREATE_REMINDER",
  VIEW_TODAY_EVENTS: "VIEW_TODAY_EVENTS",
  VIEW_TOMORROW_EVENTS: "VIEW_TOMORROW_EVENTS",
  VIEW_WEEK_EVENTS: "VIEW_WEEK_EVENTS",
  VIEW_MONTH_EVENTS: "VIEW_MONTH_EVENTS",
  VIEW_NEXT_EVENT: "VIEW_NEXT_EVENT",
  SEARCH_EVENT: "SEARCH_EVENT",
  UPDATE_EVENT: "UPDATE_EVENT",
  DELETE_EVENT: "DELETE_EVENT",
  DELETE_DAY_EVENTS: "DELETE_DAY_EVENTS",
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
    .replace(/\bdelelte\b/g, " delete ")
    .replace(/\bdelet\b/g, " delete ")
    .replace(/\bcalender\b/g, " calendar ")
    .replace(/\bcalandar\b/g, " calendar ")
    .replace(/\bcalenda\b/g, " calendar ")
    .replace(/\btommorow\b/g, " tomorrow ")
    .replace(/\btommorrow\b/g, " tomorrow ")
    .replace(/\bagenda\b/g, " calendar ")
    .replace(/\bappointment\b/g, " event ")
    .replace(/\bappointments\b/g, " events ")
    .replace(/\bto\s+do\b/g, " todo ");

const normalizeSpokenTimes = (text = "") =>
  text
    .replace(/\b([01]?\d|2[0-3])\s+([0-5]\d)\s+(a\s*m|p\s*m|am|pm)\b/g, (_match, hour, minute, meridiem) =>
      `${hour}:${minute} ${meridiem.replace(/\s+/g, "")}`
    )
    .replace(/\b([1-9]|1[0-2])\s+(a\s*m|p\s*m)\b/g, (_match, hour, meridiem) =>
      `${hour} ${meridiem.replace(/\s+/g, "")}`
    )
    .replace(/\b([1-9]|1[0-2])\s+o\s+clock\s+(am|pm)\b/g, "$1 $2");

const cleanText = (text = "") =>
  fillerPatterns
    .reduce((value, pattern) => value.replace(pattern, " "), normalizeSpokenTimes(normalizeSpeechText(applyCalendarAliases(text))))
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

const parseQueryDateWindow = (text = "") => {
  const result = parseDateResult(text);

  if (!result?.start) return {};

  const start = new Date(result.start);
  const end = new Date(start);

  if (result.allDay) {
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 1);
    end.setHours(0, 0, 0, 0);
  } else {
    end.setTime(new Date(result.end).getTime());
  }

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
};

const rangeFromCommand = (text = "") => {
  if (/\btoday\b/.test(text)) return "today";
  if (/\btomorrow\b/.test(text)) return "tomorrow";
  if (/\b(this week|week)\b/.test(text)) return "week";
  if (/\b(this month|month)\b/.test(text)) return "month";
  return "";
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
      .replace(/\b(add|create|schedule|book|set up|make|put|block|event|calendar|time|slot|google|link|on|at|from|to|with|for)\b/g, " ")
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

  return /\b(calendar|meeting|meetings|event|events|schedule|birthday|remind|reminder|reminders|task|tasks|todo|availability|available|free|busy|agenda|appointment|appointments)\b/.test(command) ||
    /\b(am i free|do i have time|what do i have|what is on|show my meetings|next meeting|next event|block time|put .* on calendar)\b/.test(command);
};

export const isConfirmationResponse = (text = "") => {
  const command = cleanText(text);

  if (
    /^(yes|yeah|yep|confirm|do it|create it|add it|delete it|update it|sure|ok|okay|please do|go ahead)\b/.test(command) ||
    /\b(yes delete|delete it|confirm delete|yes update|yes create|yes add)\b/.test(command) ||
    /\b(haan|han|ha|theek hai|kar do|delete kar do|confirm karo)\b/.test(command)
  ) {
    return "confirm";
  }

  if (
    /^(no|nope|cancel|dont|do not|stop|never mind|nevermind|not now|leave it)\b/.test(command) ||
    /\b(no cancel|cancel it|do not delete|dont delete|keep it)\b/.test(command) ||
    /\b(nahi|nahin|mat karo|cancel karo|delete mat karo)\b/.test(command)
  ) {
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

  if (
    /\b(delete|remove|clear|cancel)\b/.test(command) &&
    (
      /\b(all|every|everything|whole day|full day)\b/.test(command) ||
      /\b(all my|my all)\b/.test(command)
    ) &&
    /\b(event|events|meeting|meetings|reminder|reminders|calendar|schedule)\b/.test(command)
  ) {
    const range = rangeFromCommand(command);

    return {
      type: CALENDAR_INTENTS.DELETE_DAY_EVENTS,
      payload: {
        range: range || "today",
        needsDate: !range && !parseDateResult(command),
        naturalText: text,
        ...parseQueryDateWindow(command),
      },
      needsConfirmation: true,
    };
  }

  if (/\b(cancel|delete|remove)\b/.test(command) && /\b(event|meeting|reminder|calendar)\b/.test(command)) {
    return {
      type: CALENDAR_INTENTS.DELETE_EVENT,
      payload: {
        query: searchQueryFromCommand(command),
        naturalText: text,
        targetNext: /\bnext\b/.test(command),
        ...parseQueryDateWindow(command),
      },
      needsConfirmation: true,
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
        ...parseQueryDateWindow(command),
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
      needsConfirmation: false,
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

  if (
    /\b(show|read|tell|list)\b/.test(command) &&
    /\b(calendar|schedule|meetings|events)\b/.test(command) &&
    !/\b(tomorrow|week|month|next)\b/.test(command)
  ) {
    return {
      type: CALENDAR_INTENTS.VIEW_TODAY_EVENTS,
      payload: {},
      needsConfirmation: false,
    };
  }

  if (
    /\b(tomorrow|schedule tomorrow|calendar tomorrow|on calendar tomorrow|what is on tomorrow|what do i have tomorrow|meetings tomorrow|events tomorrow|show tomorrow)\b/.test(command) &&
    /\b(calendar|schedule|meeting|event|what is on|what do i have|show|meetings|events)\b/.test(command)
  ) {
    return {
      type: CALENDAR_INTENTS.VIEW_TOMORROW_EVENTS,
      payload: { range: "tomorrow" },
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
        ...parseQueryDateWindow(command),
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

  if (intent.type === CALENDAR_INTENTS.DELETE_DAY_EVENTS) {
    return `Should I delete all events on your calendar for ${intent.payload?.range || "that day"}?`;
  }

  return "Should I continue?";
};
