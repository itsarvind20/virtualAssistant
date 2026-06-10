import axios from "axios";

const calendarApi = (serverUrl) => `${serverUrl}/api/calendar`;

export const getCalendarStatus = async (serverUrl, signal) => {
  const response = await axios.get(`${calendarApi(serverUrl)}/status`, {
    withCredentials: true,
    signal,
  });

  return response.data;
};

export const getGoogleCalendarAuthUrl = async (serverUrl) => {
  const response = await axios.post(
    `${calendarApi(serverUrl)}/auth-url`,
    {},
    { withCredentials: true }
  );

  return response.data.authUrl;
};

export const connectGoogleCalendar = async (serverUrl) => {
  const authUrl = await getGoogleCalendarAuthUrl(serverUrl);

  window.location.href = authUrl;
};

export const createCalendarEvent = async (serverUrl, payload, signal) => {
  const response = await axios.post(`${calendarApi(serverUrl)}/create-event`, payload, {
    withCredentials: true,
    signal,
  });

  return response.data.event;
};

export const createBirthdayEvent = async (serverUrl, payload, signal) => {
  const response = await axios.post(`${calendarApi(serverUrl)}/create-birthday`, payload, {
    withCredentials: true,
    signal,
  });

  return response.data.event;
};

export const createReminderEvent = async (serverUrl, payload, signal) => {
  const response = await axios.post(`${calendarApi(serverUrl)}/create-reminder`, payload, {
    withCredentials: true,
    signal,
  });

  return response.data.event;
};

export const getTodayEvents = async (serverUrl, signal) => {
  const response = await axios.get(`${calendarApi(serverUrl)}/events/today`, {
    withCredentials: true,
    signal,
  });

  return response.data.events || [];
};

export const getWeekEvents = async (serverUrl, signal) => {
  const response = await axios.get(`${calendarApi(serverUrl)}/events/week`, {
    withCredentials: true,
    signal,
  });

  return response.data.events || [];
};

export const getEventsByRange = async (serverUrl, params = {}, signal) => {
  const response = await axios.get(`${calendarApi(serverUrl)}/events`, {
    withCredentials: true,
    params,
    signal,
  });

  return response.data.events || [];
};

export const getNextEvent = async (serverUrl, signal) => {
  const response = await axios.get(`${calendarApi(serverUrl)}/events/next`, {
    withCredentials: true,
    signal,
  });

  return response.data.event || null;
};

export const searchCalendarEvents = async (serverUrl, params = {}, signal) => {
  const response = await axios.get(`${calendarApi(serverUrl)}/search`, {
    withCredentials: true,
    params,
    signal,
  });

  return response.data.events || [];
};

export const updateCalendarEvent = async (serverUrl, eventId, payload, signal) => {
  const response = await axios.patch(`${calendarApi(serverUrl)}/update-event/${eventId}`, payload, {
    withCredentials: true,
    signal,
  });

  return response.data.event;
};

export const deleteCalendarEvent = async (serverUrl, eventId, signal) => {
  const response = await axios.delete(`${calendarApi(serverUrl)}/delete-event/${eventId}`, {
    withCredentials: true,
    signal,
  });

  return response.data;
};

export const deleteCalendarEventsByRange = async (serverUrl, payload, signal) => {
  const response = await axios.post(`${calendarApi(serverUrl)}/delete-events-by-range`, payload, {
    withCredentials: true,
    signal,
  });

  return response.data;
};

export const checkCalendarAvailability = async (serverUrl, payload, signal) => {
  const response = await axios.post(`${calendarApi(serverUrl)}/freebusy`, payload, {
    withCredentials: true,
    signal,
  });

  return response.data;
};
