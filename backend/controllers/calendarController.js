import {
    checkFreeBusy,
    createBirthdayEvent,
    createCalendarEvent,
    createReminderEvent,
    deleteCalendarEvent,
    deleteCalendarEventsByRange,
    getCalendarAuthUrl,
    getConnectionStatus,
    getNextEvent,
    handleOAuthCallback,
    listEvents,
    searchEvents,
    updateCalendarEvent
} from "../services/googleCalendarService.js";

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

const sendError = (res, error) => {
    const status = error.status || error.response?.status || 500;
    const googleReason = error.response?.data?.error?.message;

    return res.status(status).json({
        success: false,
        code: error.code,
        message: googleReason || error.message || "Calendar request failed"
    });
};

export const getCalendarStatus = async (req, res) => {
    try {
        const status = await getConnectionStatus(req.userId);

        return res.json({
            success: true,
            ...status
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const createCalendarAuthUrl = async (req, res) => {
    try {
        const authUrl = getCalendarAuthUrl(req.userId);

        return res.json({
            success: true,
            authUrl
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const googleOAuthCallback = async (req, res) => {
    try {
        await handleOAuthCallback({
            code: req.query.code,
            state: req.query.state
        });

        return res.redirect(`${frontendUrl()}/?calendar=connected`);
    } catch (error) {
        console.log("Google OAuth callback error:", error.response?.data || error.message);

        return res.redirect(
            `${frontendUrl()}/?calendar=error&message=${encodeURIComponent(error.message || "Google Calendar connection failed")}`
        );
    }
};

export const createEvent = async (req, res) => {
    try {
        const event = await createCalendarEvent(req.userId, req.body);

        return res.status(201).json({
            success: true,
            event
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const createBirthday = async (req, res) => {
    try {
        const event = await createBirthdayEvent(req.userId, req.body);

        return res.status(201).json({
            success: true,
            event
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const createReminder = async (req, res) => {
    try {
        const event = await createReminderEvent(req.userId, req.body);

        return res.status(201).json({
            success: true,
            event
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const getTodayEvents = async (req, res) => {
    try {
        const data = await listEvents(req.userId, {
            range: "today",
            maxResults: Number(req.query.maxResults) || 10
        });

        return res.json({
            success: true,
            ...data
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const getWeekEvents = async (req, res) => {
    try {
        const data = await listEvents(req.userId, {
            range: "week",
            maxResults: Number(req.query.maxResults) || 20
        });

        return res.json({
            success: true,
            ...data
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const getEventsByRange = async (req, res) => {
    try {
        const data = await listEvents(req.userId, {
            range: req.query.range || "today",
            timeMin: req.query.timeMin,
            timeMax: req.query.timeMax,
            maxResults: Number(req.query.maxResults) || 10
        });

        return res.json({
            success: true,
            ...data
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const getNextCalendarEvent = async (req, res) => {
    try {
        const event = await getNextEvent(req.userId);

        return res.json({
            success: true,
            event
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const searchCalendarEvents = async (req, res) => {
    try {
        const events = await searchEvents(req.userId, {
            q: req.query.q || "",
            timeMin: req.query.timeMin,
            timeMax: req.query.timeMax,
            maxResults: Number(req.query.maxResults) || 10
        });

        return res.json({
            success: true,
            events
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const updateEvent = async (req, res) => {
    try {
        const event = await updateCalendarEvent(req.userId, req.params.eventId, req.body);

        return res.json({
            success: true,
            event
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const data = await deleteCalendarEvent(req.userId, req.params.eventId);

        return res.json({
            success: true,
            ...data
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const deleteEventsByRange = async (req, res) => {
    try {
        const data = await deleteCalendarEventsByRange(req.userId, req.body);

        return res.json({
            success: true,
            ...data
        });
    } catch (error) {
        return sendError(res, error);
    }
};

export const freeBusy = async (req, res) => {
    try {
        const data = await checkFreeBusy(req.userId, req.body);

        return res.json({
            success: true,
            ...data
        });
    } catch (error) {
        return sendError(res, error);
    }
};
