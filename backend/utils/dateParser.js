import * as chrono from "chrono-node";

export const DEFAULT_TIME_ZONE = process.env.CALENDAR_TIME_ZONE || "Asia/Kolkata";

const WEEKDAY_MAP = {
    sunday: "SU",
    monday: "MO",
    tuesday: "TU",
    wednesday: "WE",
    thursday: "TH",
    friday: "FR",
    saturday: "SA"
};

const pad = (value) => String(value).padStart(2, "0");

export const toDateOnly = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const startOfDay = (date = new Date()) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

export const endOfDay = (date = new Date()) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

export const addMinutes = (date, minutes = 60) =>
    new Date(date.getTime() + minutes * 60 * 1000);

export const addDays = (date, days = 1) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const setTime = (date, hour, minute = 0) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);

const hasCertainTime = (components) =>
    Boolean(
        components?.isCertain?.("hour") ||
        components?.isCertain?.("minute")
    );

export const applyTimeHint = (date, text = "") => {
    const normalized = String(text).toLowerCase();

    if (/\bmorning\b/.test(normalized)) return setTime(date, 9);
    if (/\bnoon\b/.test(normalized)) return setTime(date, 12);
    if (/\bafternoon\b/.test(normalized)) return setTime(date, 14);
    if (/\bevening\b/.test(normalized)) return setTime(date, 18);
    if (/\bnight\b/.test(normalized)) return setTime(date, 20);

    return date;
};

export const parseDateRange = ({
    text = "",
    defaultDurationMinutes = 60,
    now = new Date()
} = {}) => {
    const results = chrono.parse(text, now, { forwardDate: true });

    if (!results.length) {
        return {
            start: null,
            end: null,
            allDay: false,
            matchedText: ""
        };
    }

    const result = results[0];
    const hasStartTime = hasCertainTime(result.start);
    const hasEndTime = hasCertainTime(result.end);
    let start = result.start.date();
    let end = result.end?.date?.() || null;

    if (!hasStartTime) {
        start = applyTimeHint(start, text);
    }

    if (!end) {
        end = addMinutes(start, defaultDurationMinutes);
    } else if (!hasEndTime) {
        end = addMinutes(start, defaultDurationMinutes);
    }

    return {
        start,
        end,
        allDay: !hasStartTime && !/\b(morning|noon|afternoon|evening|night)\b/i.test(text),
        matchedText: result.text
    };
};

export const parseCalendarRange = (range = "today") => {
    const normalized = String(range).toLowerCase();
    const today = startOfDay(new Date());

    if (normalized.includes("tomorrow")) {
        const tomorrow = addDays(today, 1);
        return {
            start: tomorrow,
            end: endOfDay(tomorrow),
            label: "tomorrow"
        };
    }

    if (normalized.includes("month")) {
        return {
            start: today,
            end: addDays(today, 31),
            label: "this month"
        };
    }

    if (normalized.includes("week")) {
        return {
            start: today,
            end: addDays(today, 7),
            label: "this week"
        };
    }

    return {
        start: today,
        end: endOfDay(today),
        label: "today"
    };
};

export const parseRecurrence = (text = "") => {
    const normalized = String(text).toLowerCase();

    if (/\bevery\s+day\b|\bdaily\b/.test(normalized)) {
        return ["RRULE:FREQ=DAILY"];
    }

    const weekday = Object.keys(WEEKDAY_MAP).find((day) =>
        new RegExp(`\\bevery\\s+${day}\\b`).test(normalized)
    );

    if (weekday) {
        return [`RRULE:FREQ=WEEKLY;BYDAY=${WEEKDAY_MAP[weekday]}`];
    }

    if (/\bevery\s+month\b|\bmonthly\b/.test(normalized)) {
        return ["RRULE:FREQ=MONTHLY"];
    }

    if (/\bevery\s+year\b|\byearly\b|\bannually\b/.test(normalized)) {
        return ["RRULE:FREQ=YEARLY"];
    }

    return [];
};

export const parseBirthdayDate = (text = "") => {
    const { start } = parseDateRange({
        text,
        defaultDurationMinutes: 24 * 60
    });

    if (!start) return null;

    return {
        date: toDateOnly(start),
        nextDate: toDateOnly(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1))
    };
};

export const eventDatePayload = ({ start, end, allDay = false, timeZone = DEFAULT_TIME_ZONE }) => {
    if (allDay) {
        return {
            start: { date: toDateOnly(start) },
            end: { date: toDateOnly(addDays(start, 1)) }
        };
    }

    return {
        start: {
            dateTime: start.toISOString(),
            timeZone
        },
        end: {
            dateTime: end.toISOString(),
            timeZone
        }
    };
};

export const formatEventTime = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: DEFAULT_TIME_ZONE
    }).format(date);
};
