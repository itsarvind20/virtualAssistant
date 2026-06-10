import express from "express";
import {
    createBirthday,
    createCalendarAuthUrl,
    createEvent,
    createReminder,
    deleteEvent,
    deleteEventsByRange,
    freeBusy,
    getCalendarStatus,
    getEventsByRange,
    getNextCalendarEvent,
    getTodayEvents,
    getWeekEvents,
    googleOAuthCallback,
    searchCalendarEvents,
    updateEvent
} from "../controllers/calendarController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const calendarRouter = express.Router();

calendarRouter.get("/oauth/callback", googleOAuthCallback);

calendarRouter.use(authMiddleware);

calendarRouter.get("/status", getCalendarStatus);
calendarRouter.post("/auth-url", createCalendarAuthUrl);
calendarRouter.post("/create-event", createEvent);
calendarRouter.post("/create-birthday", createBirthday);
calendarRouter.post("/create-reminder", createReminder);
calendarRouter.get("/events/today", getTodayEvents);
calendarRouter.get("/events/week", getWeekEvents);
calendarRouter.get("/events", getEventsByRange);
calendarRouter.get("/events/next", getNextCalendarEvent);
calendarRouter.get("/search", searchCalendarEvents);
calendarRouter.patch("/update-event/:eventId", updateEvent);
calendarRouter.delete("/delete-event/:eventId", deleteEvent);
calendarRouter.post("/delete-events-by-range", deleteEventsByRange);
calendarRouter.post("/freebusy", freeBusy);

export default calendarRouter;
