import crypto from "crypto";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import User from "../models/user.model.js";
import {
    DEFAULT_TIME_ZONE,
    addDays,
    eventDatePayload,
    parseBirthdayDate,
    parseCalendarRange,
    parseDateRange,
    parseRecurrence,
    toDateOnly
} from "../utils/dateParser.js";

const CALENDAR_SCOPES = [
    "https://www.googleapis.com/auth/calendar"
];

const getTokenKey = () =>
    crypto
        .createHash("sha256")
        .update(process.env.GOOGLE_TOKEN_ENCRYPTION_SECRET || process.env.JWT_SECRET || "calendar-token-key")
        .digest();

const encryptValue = (value = "") => {
    if (!value) return "";

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", getTokenKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(String(value), "utf8"),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag();

    return [
        iv.toString("base64"),
        tag.toString("base64"),
        encrypted.toString("base64")
    ].join(".");
};

const decryptValue = (value = "") => {
    if (!value) return "";

    const parts = String(value).split(".");

    if (parts.length !== 3) {
        return value;
    }

    const [ivText, tagText, encryptedText] = parts;
    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        getTokenKey(),
        Buffer.from(ivText, "base64")
    );

    decipher.setAuthTag(Buffer.from(tagText, "base64"));

    return Buffer.concat([
        decipher.update(Buffer.from(encryptedText, "base64")),
        decipher.final()
    ]).toString("utf8");
};

const assertGoogleConfig = () => {
    const missing = [
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_REDIRECT_URI"
    ].filter((key) => !process.env[key]);

    if (missing.length) {
        const error = new Error(`Missing Google OAuth config: ${missing.join(", ")}`);
        error.status = 500;
        throw error;
    }
};

const createOAuthClient = () => {
    assertGoogleConfig();

    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
};

const saveTokensForUser = async (userId, tokens = {}) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
    }

    const existingCalendar = user.googleCalendar || {};

    user.googleCalendar = {
        accessToken: tokens.access_token
            ? encryptValue(tokens.access_token)
            : existingCalendar.accessToken,
        refreshToken: tokens.refresh_token
            ? encryptValue(tokens.refresh_token)
            : existingCalendar.refreshToken,
        expiryDate: tokens.expiry_date || existingCalendar.expiryDate,
        scope: tokens.scope || existingCalendar.scope,
        tokenType: tokens.token_type || existingCalendar.tokenType,
        connectedAt: existingCalendar.connectedAt || new Date(),
        updatedAt: new Date()
    };

    await user.save();

    return user.googleCalendar;
};

const getAuthorizedClient = async (userId) => {
    const user = await User.findById(userId).select("googleCalendar");
    const tokens = user?.googleCalendar;

    if (!tokens?.refreshToken && !tokens?.accessToken) {
        const error = new Error("Google Calendar is not connected");
        error.status = 401;
        error.code = "GOOGLE_CALENDAR_NOT_CONNECTED";
        throw error;
    }

    const oauth2Client = createOAuthClient();

    oauth2Client.setCredentials({
        access_token: decryptValue(tokens.accessToken),
        refresh_token: decryptValue(tokens.refreshToken),
        expiry_date: tokens.expiryDate,
        scope: tokens.scope,
        token_type: tokens.tokenType || "Bearer"
    });

    oauth2Client.on("tokens", async (newTokens) => {
        await saveTokensForUser(userId, newTokens).catch((error) => {
            console.log("Google token refresh save failed:", error.message);
        });
    });

    return oauth2Client;
};

const getCalendar = async (userId) => {
    const auth = await getAuthorizedClient(userId);

    return google.calendar({ version: "v3", auth });
};

const normalizeAttendees = (attendees = []) =>
    (Array.isArray(attendees) ? attendees : String(attendees).split(","))
        .map((email) => String(email).trim())
        .filter(Boolean)
        .map((email) => ({ email }));

const normalizeReminderOverrides = (reminders = [10]) =>
    (Array.isArray(reminders) ? reminders : [reminders])
        .map((minutes) => Number(minutes))
        .filter((minutes) => Number.isFinite(minutes) && minutes >= 0)
        .map((minutes) => ({
            method: "popup",
            minutes
        }));

const buildEventBody = ({
    title,
    summary,
    description = "",
    location = "",
    attendees = [],
    start,
    end,
    allDay = false,
    timeZone = DEFAULT_TIME_ZONE,
    reminders = [10],
    recurrence = [],
    createMeet = false
} = {}) => {
    const eventTitle = title || summary;

    if (!eventTitle) {
        const error = new Error("Event title is required");
        error.status = 400;
        throw error;
    }

    if (!start || !end) {
        const error = new Error("Event start and end time are required");
        error.status = 400;
        throw error;
    }

    const event = {
        summary: eventTitle,
        description,
        location,
        attendees: normalizeAttendees(attendees),
        reminders: {
            useDefault: false,
            overrides: normalizeReminderOverrides(reminders)
        },
        recurrence,
        ...eventDatePayload({ start: new Date(start), end: new Date(end), allDay, timeZone })
    };

    if (!event.attendees.length) {
        delete event.attendees;
    }

    if (!event.recurrence.length) {
        delete event.recurrence;
    }

    if (createMeet) {
        event.conferenceData = {
            createRequest: {
                requestId: `meet-${Date.now()}-${crypto.randomUUID()}`
            }
        };
    }

    return event;
};

export const getCalendarAuthUrl = (userId) => {
    const oauth2Client = createOAuthClient();
    const state = jwt.sign(
        {
            userId,
            type: "google-calendar"
        },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
    );

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: true,
        scope: CALENDAR_SCOPES,
        state
    });
};

export const handleOAuthCallback = async ({ code, state }) => {
    if (!code || !state) {
        const error = new Error("OAuth callback is missing code or state");
        error.status = 400;
        throw error;
    }

    const decodedState = jwt.verify(state, process.env.JWT_SECRET);

    if (decodedState.type !== "google-calendar") {
        const error = new Error("Invalid OAuth state");
        error.status = 400;
        throw error;
    }

    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    await saveTokensForUser(decodedState.userId, tokens);

    return decodedState.userId;
};

export const getConnectionStatus = async (userId) => {
    const user = await User.findById(userId).select("googleCalendar");

    return {
        connected: Boolean(user?.googleCalendar?.refreshToken || user?.googleCalendar?.accessToken),
        updatedAt: user?.googleCalendar?.updatedAt || null
    };
};

export const createCalendarEvent = async (userId, payload = {}) => {
    const calendar = await getCalendar(userId);
    const naturalText = payload.naturalText || payload.command || "";
    const parsed = payload.start
        ? {
            start: new Date(payload.start),
            end: payload.end ? new Date(payload.end) : new Date(new Date(payload.start).getTime() + 60 * 60 * 1000),
            allDay: Boolean(payload.allDay)
        }
        : parseDateRange({
            text: naturalText,
            defaultDurationMinutes: payload.defaultDurationMinutes || 60
        });
    const recurrence = payload.recurrence?.length
        ? payload.recurrence
        : parseRecurrence(naturalText);

    const eventBody = buildEventBody({
        ...payload,
        title: payload.title || payload.summary,
        start: parsed.start,
        end: parsed.end,
        allDay: payload.allDay ?? parsed.allDay,
        recurrence,
        reminders: payload.reminders || [10]
    });

    const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: eventBody,
        conferenceDataVersion: payload.createMeet ? 1 : 0,
        sendUpdates: "all"
    });

    return response.data;
};

export const createBirthdayEvent = async (userId, payload = {}) => {
    const calendar = await getCalendar(userId);
    const birthdayDate = payload.date
        ? {
            date: payload.date,
            nextDate: payload.nextDate || toDateOnly(addDays(new Date(payload.date), 1))
        }
        : parseBirthdayDate(payload.naturalText || payload.command || "");

    if (!birthdayDate?.date) {
        const error = new Error("Birthday date is required");
        error.status = 400;
        throw error;
    }

    const name = payload.name || payload.title || "Birthday";
    const eventBody = {
        summary: name.toLowerCase().includes("birthday") ? name : `${name} birthday`,
        description: payload.description || "Birthday reminder created by your voice assistant.",
        start: { date: birthdayDate.date },
        end: { date: birthdayDate.nextDate || birthdayDate.date },
        recurrence: ["RRULE:FREQ=YEARLY"],
        reminders: {
            useDefault: false,
            overrides: normalizeReminderOverrides(payload.reminders || [24 * 60])
        }
    };

    const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: eventBody
    });

    return response.data;
};

export const createReminderEvent = async (userId, payload = {}) => {
    const naturalText = payload.naturalText || payload.command || "";
    const parsed = payload.start
        ? {
            start: new Date(payload.start),
            end: payload.end ? new Date(payload.end) : new Date(new Date(payload.start).getTime() + 30 * 60 * 1000),
            allDay: Boolean(payload.allDay)
        }
        : parseDateRange({
            text: naturalText,
            defaultDurationMinutes: payload.defaultDurationMinutes || 30
        });

    return createCalendarEvent(userId, {
        ...payload,
        title: payload.title || payload.summary || "Reminder",
        description: payload.description || "Reminder created by your voice assistant.",
        start: parsed.start,
        end: parsed.end,
        allDay: payload.allDay ?? parsed.allDay,
        reminders: payload.reminders || [0, 10],
        recurrence: payload.recurrence?.length ? payload.recurrence : parseRecurrence(naturalText)
    });
};

export const listEvents = async (userId, { range = "today", timeMin, timeMax, maxResults = 10 } = {}) => {
    const calendar = await getCalendar(userId);
    const parsedRange = timeMin && timeMax
        ? {
            start: new Date(timeMin),
            end: new Date(timeMax),
            label: range
        }
        : parseCalendarRange(range);

    const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: parsedRange.start.toISOString(),
        timeMax: parsedRange.end.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: "startTime"
    });

    return {
        label: parsedRange.label,
        events: response.data.items || []
    };
};

export const getNextEvent = async (userId) => {
    const calendar = await getCalendar(userId);
    const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 1,
        singleEvents: true,
        orderBy: "startTime"
    });

    return response.data.items?.[0] || null;
};

export const searchEvents = async (userId, { q = "", timeMin, timeMax, maxResults = 10 } = {}) => {
    const calendar = await getCalendar(userId);
    const now = new Date();
    const response = await calendar.events.list({
        calendarId: "primary",
        q,
        timeMin: timeMin || new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString(),
        timeMax: timeMax || new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: "startTime"
    });

    return response.data.items || [];
};

export const updateCalendarEvent = async (userId, eventId, payload = {}) => {
    if (!eventId) {
        const error = new Error("Event ID is required");
        error.status = 400;
        throw error;
    }

    const calendar = await getCalendar(userId);
    const existing = await calendar.events.get({
        calendarId: "primary",
        eventId
    });
    const patchBody = {};

    if (payload.title || payload.summary) patchBody.summary = payload.title || payload.summary;
    if (payload.description !== undefined) patchBody.description = payload.description;
    if (payload.location !== undefined) patchBody.location = payload.location;
    if (payload.attendees) patchBody.attendees = normalizeAttendees(payload.attendees);
    if (payload.reminders) {
        patchBody.reminders = {
            useDefault: false,
            overrides: normalizeReminderOverrides(payload.reminders)
        };
    }
    if (payload.recurrence) patchBody.recurrence = payload.recurrence;

    const parsed = payload.start
        ? {
            start: new Date(payload.start),
            end: payload.end ? new Date(payload.end) : new Date(new Date(payload.start).getTime() + 60 * 60 * 1000),
            allDay: Boolean(payload.allDay)
        }
        : payload.naturalText
            ? parseDateRange({ text: payload.naturalText })
            : null;

    if (parsed?.start && parsed?.end) {
        Object.assign(
            patchBody,
            eventDatePayload({
                start: parsed.start,
                end: parsed.end,
                allDay: payload.allDay ?? parsed.allDay,
                timeZone: payload.timeZone || DEFAULT_TIME_ZONE
            })
        );
    }

    if (payload.createMeet && !existing.data.conferenceData?.conferenceId) {
        patchBody.conferenceData = {
            createRequest: {
                requestId: `meet-${Date.now()}-${crypto.randomUUID()}`
            }
        };
    }

    const response = await calendar.events.patch({
        calendarId: "primary",
        eventId,
        requestBody: patchBody,
        conferenceDataVersion: payload.createMeet ? 1 : 0,
        sendUpdates: "all"
    });

    return response.data;
};

export const deleteCalendarEvent = async (userId, eventId) => {
    if (!eventId) {
        const error = new Error("Event ID is required");
        error.status = 400;
        throw error;
    }

    const calendar = await getCalendar(userId);

    await calendar.events.delete({
        calendarId: "primary",
        eventId,
        sendUpdates: "all"
    });

    return { deleted: true, eventId };
};

export const deleteCalendarEventsByRange = async (userId, { range = "today", timeMin, timeMax } = {}) => {
    const calendar = await getCalendar(userId);
    const parsedRange = timeMin && timeMax
        ? {
            start: new Date(timeMin),
            end: new Date(timeMax),
            label: range
        }
        : parseCalendarRange(range);

    const listRangeEvents = async () => {
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: parsedRange.start.toISOString(),
            timeMax: parsedRange.end.toISOString(),
            maxResults: 250,
            singleEvents: true,
            orderBy: "startTime",
            showDeleted: false
        });

        return response.data.items || [];
    };

    const events = await listRangeEvents();
    const deleted = [];
    const failed = [];

    for (const event of events) {
        if (!event.id) {
            failed.push({
                id: "",
                summary: event.summary || "Untitled event",
                message: "Event ID is missing"
            });
            continue;
        }

        try {
            await calendar.events.delete({
                calendarId: "primary",
                eventId: event.id,
                sendUpdates: "all"
            });
            deleted.push({
                id: event.id,
                summary: event.summary || "Untitled event"
            });
        } catch (error) {
            failed.push({
                id: event.id,
                summary: event.summary || "Untitled event",
                message: error.response?.data?.error?.message || error.message || "Delete failed"
            });
        }
    }

    const remaining = await listRangeEvents();
    const deletedIds = new Set(deleted.map((event) => event.id));
    const stillPresent = remaining.filter((event) => deletedIds.has(event.id));

    for (const event of stillPresent) {
        if (!failed.some((failure) => failure.id === event.id)) {
            failed.push({
                id: event.id,
                summary: event.summary || "Untitled event",
                message: "Event is still present after delete request"
            });
        }
    }

    return {
        label: parsedRange.label,
        requestedCount: events.length,
        deletedCount: deleted.length - stillPresent.length,
        failedCount: failed.length,
        remainingCount: remaining.length,
        deleted: deleted.filter((event) => !stillPresent.some((remainingEvent) => remainingEvent.id === event.id)),
        failed,
        remaining: remaining.map((event) => ({
            id: event.id,
            summary: event.summary || "Untitled event"
        }))
    };
};

export const checkFreeBusy = async (userId, payload = {}) => {
    const calendar = await getCalendar(userId);
    const parsed = payload.timeMin && payload.timeMax
        ? {
            start: new Date(payload.timeMin),
            end: new Date(payload.timeMax)
        }
        : parseDateRange({
            text: payload.naturalText || payload.command || "",
            defaultDurationMinutes: payload.defaultDurationMinutes || 60
        });

    if (!parsed.start || !parsed.end) {
        const error = new Error("Start and end time are required for availability check");
        error.status = 400;
        throw error;
    }

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: parsed.start.toISOString(),
            timeMax: parsed.end.toISOString(),
            timeZone: payload.timeZone || DEFAULT_TIME_ZONE,
            items: [{ id: "primary" }]
        }
    });
    const busy = response.data.calendars?.primary?.busy || [];

    return {
        free: busy.length === 0,
        busy,
        timeMin: parsed.start.toISOString(),
        timeMax: parsed.end.toISOString()
    };
};
