import React from "react";
import { CalendarClock, ExternalLink, MapPin, Video } from "lucide-react";

const formatEventTime = (event = {}) => {
  const startValue = event.start?.dateTime || event.start?.date;

  if (!startValue) return "Time not set";
  if (event.start?.date) return "All day";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(startValue));
};

function EventCard({ event }) {
  if (!event) return null;

  const meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.find((entry) => entry.uri)?.uri;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-left">
      <p className="line-clamp-1 text-xs font-semibold text-white sm:text-sm">{event.summary || "Untitled event"}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
        <CalendarClock size={14} />
        <span>{formatEventTime(event)}</span>
      </div>
      {event.location ? (
        <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
          <MapPin size={14} />
          <span className="line-clamp-1">{event.location}</span>
        </div>
      ) : null}
      {meetLink ? (
        <div className="mt-1 flex items-center gap-2 text-xs text-cyan-200">
          <Video size={14} />
          <span>Google Meet attached</span>
        </div>
      ) : null}
      {event.htmlLink ? (
        <a
          className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-cyan-200 transition hover:text-cyan-100"
          href={event.htmlLink}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink size={14} />
          Open in Calendar
        </a>
      ) : null}
    </div>
  );
}

export default EventCard;
