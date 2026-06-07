import React from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import EventCard from "./EventCard";

function CalendarPanel({
  connected,
  loading,
  events = [],
  error,
  notice,
  onConnect,
  onRefresh,
}) {
  return (
    <div className="min-h-0 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60">google calendar</p>
          <p className="mt-1 line-clamp-1 text-xs text-white/65 sm:text-sm">
            {connected ? "Connected and ready for voice commands." : "Connect Calendar for schedule commands."}
          </p>
        </div>
        <CalendarDays className="text-cyan-200" size={20} />
      </div>

      {error ? <p className="mt-2 line-clamp-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-200">{error}</p> : null}
      {notice ? <p className="mt-2 line-clamp-2 rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-200">{notice}</p> : null}

      <div className="mt-3 flex gap-2">
        {connected ? (
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        ) : (
          <button
            className="h-9 rounded-full bg-cyan-300 px-3 text-xs font-semibold text-black transition hover:bg-cyan-200 disabled:opacity-60"
            disabled={loading}
            onClick={onConnect}
            type="button"
          >
            {loading ? "Connecting..." : "Connect Google"}
          </button>
        )}
      </div>

      {connected ? (
        <div className="mt-3 grid max-h-28 gap-2 overflow-auto pr-1 lg:max-h-36">
          {events.length ? (
            events.slice(0, 3).map((event) => <EventCard event={event} key={event.id} />)
          ) : (
            <p className="rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-white/55 sm:text-sm">
              No calendar events today.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default CalendarPanel;
