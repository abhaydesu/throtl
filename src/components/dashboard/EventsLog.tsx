// Filename: src/components/dashboard/EventsLog.tsx
import { memo } from "react";
import type { Event } from "../../types";

function EventsLogComponent({ events }: { events: Event[] }) {
  console.log("[EventsLog] render", { events: events.length });
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-sm p-4">
      <h3 className="text-lg font-semibold text-neutral-200 mb-4">
        Throttled Events
      </h3>
      <div className="space-y-2 text-sm font-mono max-h-48 overflow-y-auto">
        {events.length === 0 && (
          <p className="text-neutral-500">No events yet.</p>
        )}
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={
                event.type === "throttle" ? "text-red-500" : "text-green-500"
              }
            >
              {event.type === "throttle" ? "🔴" : "🟢"}
            </span>
            <span className="text-neutral-500">
              {event.timestamp.toLocaleTimeString()}
            </span>
            <span className="text-neutral-300">{event.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const EventsLog = memo(EventsLogComponent);
