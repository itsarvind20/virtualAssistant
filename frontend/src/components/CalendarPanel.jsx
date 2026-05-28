import React from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import EventCard from "./EventCard";

function CalendarPanel({
  connected,
  loading,
  events = [],
  error,
  onConnect,
  onRefresh,
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/60">google calendar</p>
          <p className="mt-1 text-sm text-white/65">
            {connected ? "Connected and ready for voice commands." : "Connect Calendar for schedule commands."}
          </p>
        </div>
        <CalendarDays className="text-cyan-200" size={20} />
      </div>

      {error ? <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        {connected ? (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        ) : (
          <button
            className="h-10 rounded-full bg-cyan-300 px-4 text-sm font-semibold text-black transition hover:bg-cyan-200 disabled:opacity-60"
            disabled={loading}
            onClick={onConnect}
            type="button"
          >
            {loading ? "Connecting..." : "Connect Google"}
          </button>
        )}
      </div>

      {connected ? (
        <div className="mt-4 grid max-h-56 gap-2 overflow-auto pr-1">
          {events.length ? (
            events.slice(0, 3).map((event) => <EventCard event={event} key={event.id} />)
          ) : (
            <p className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/55">
              No calendar events today.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default CalendarPanel;
