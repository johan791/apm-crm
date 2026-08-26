"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getWeekNumber, formatDate } from "@/lib/format";

const eventTypeLabels: Record<string, string> = {
  delivery: "Leverans",
  installation: "Installation",
  pickup: "Upphämtning",
};

const eventTypeColors: Record<string, string> = {
  delivery: "bg-accent-blue-subtle text-accent-blue",
  installation: "bg-accent-green-subtle text-accent-green",
  pickup: "bg-accent-amber-subtle text-accent-amber",
};

interface EventItem {
  id: string;
  type: string;
  date: Date;
  time: string | null;
  notes: string | null;
  completedAt: Date | null;
  project: { name: string };
  customer: { companyName: string };
}

interface EventListProps {
  events: EventItem[];
}

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Inga händelser denna månad.
        </p>
      </div>
    );
  }

  const weeks = new Map<number, EventItem[]>();
  for (const event of events) {
    const week = getWeekNumber(event.date);
    if (!weeks.has(week)) weeks.set(week, []);
    weeks.get(week)!.push(event);
  }

  return (
    <div className="space-y-6">
      {Array.from(weeks.entries()).map(([weekNum, weekEvents]) => (
        <div key={weekNum}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Vecka {weekNum}
          </h3>
          <div className="space-y-2">
            {weekEvents.map((event) => (
              <Link
                key={event.id}
                href={`/leveransplanering/${event.id}/redigera`}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium shrink-0 ${
                    eventTypeColors[event.type] ??
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {eventTypeLabels[event.type] ?? event.type}
                </span>
                <span className="text-sm font-medium whitespace-nowrap">
                  {formatDate(event.date)}
                  {event.time ? ` kl. ${event.time}` : ""}
                </span>
                {event.completedAt && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium text-status-active shrink-0"
                    title={`Genomförd ${formatDate(event.completedAt)}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Genomförd
                  </span>
                )}
                <span className="text-sm truncate">
                  {event.project.name}
                </span>
                <span className="text-sm text-muted-foreground truncate hidden sm:inline">
                  {event.customer.companyName}
                </span>
                {event.notes && (
                  <span className="ml-auto text-sm text-muted-foreground truncate max-w-[200px] hidden md:inline">
                    {event.notes}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
