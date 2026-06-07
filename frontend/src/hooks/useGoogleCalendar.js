import { useCallback, useEffect, useState } from "react";
import {
  connectGoogleCalendar,
  getCalendarStatus,
  getTodayEvents,
  getWeekEvents,
} from "../services/calendarService";

export const useGoogleCalendar = ({ serverUrl, enabled = true } = {}) => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async (signal) => {
    if (!enabled || !serverUrl) return;

    setLoading(true);
    setError("");

    try {
      const status = await getCalendarStatus(serverUrl, signal);
      setConnected(Boolean(status.connected));

      if (status.connected) {
        const todayEvents = await getTodayEvents(serverUrl, signal);
        setEvents(todayEvents);
      } else {
        setEvents([]);
      }
    } catch (requestError) {
      setConnected(false);
      setEvents([]);
      setError(requestError.response?.data?.message || "Calendar status unavailable.");
    } finally {
      setLoading(false);
    }
  }, [enabled, serverUrl]);

  const loadWeek = useCallback(async () => {
    if (!serverUrl) return [];

    const weekEvents = await getWeekEvents(serverUrl);
    setEvents(weekEvents);
    return weekEvents;
  }, [serverUrl]);

  const connect = useCallback(async () => {
    if (!serverUrl) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      await connectGoogleCalendar(serverUrl);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not start Google Calendar connection.");
      setLoading(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    const controller = new AbortController();

    refresh(controller.signal);

    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarResult = params.get("calendar");

    if (!calendarResult) return;

    if (calendarResult === "connected") {
      setNotice("Google Calendar connected.");
      setError("");
    }

    if (calendarResult === "error") {
      setNotice("");
      setError(params.get("message") || "Google Calendar connection failed.");
    }

    params.delete("calendar");
    params.delete("message");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  return {
    connected,
    loading,
    events,
    error,
    notice,
    connect,
    refresh,
    loadWeek,
    setEvents,
  };
};
