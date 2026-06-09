"use client";

import Link from "next/link";
import { getWeekNumber, swedishDaysShort } from "@/lib/format";

const eventTypeColors: Record<string, string> = {
  delivery: "bg-accent-blue-subtle text-accent-blue",
  installation: "bg-accent-green-subtle text-accent-green",
  pickup: "bg-accent-amber-subtle text-accent-amber",
};

interface CalendarEvent {
  id: string;
  type: string;
  date: Date;
  time: string | null;
  project: { name: string };
  customer: { companyName: string };
  notes: string | null;
}

interface CalendarGridProps {
  events: CalendarEvent[];
  year: number;
  month: number;
}

export function CalendarGrid({ events, year, month }: CalendarGridProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1);
  // getDay() returns 0=Sun, we want Mon=0
  const firstDayOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Build a map of date string -> events for quick lookup
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const d = new Date(event.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!eventsByDate.has(key)) {
      eventsByDate.set(key, []);
    }
    eventsByDate.get(key)!.push(event);
  }

  // Calculate previous month days to fill the start
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Build all cells: prev month padding + current month + next month padding
  const cells: Array<{
    day: number;
    isCurrentMonth: boolean;
    dateStr: string;
    date: Date;
  }> = [];

  // Previous month days
  for (let i = firstDayOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const d = new Date(year, month - 1, day);
    cells.push({
      day,
      isCurrentMonth: false,
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      date: d,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({
      day,
      isCurrentMonth: true,
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      date: d,
    });
  }

  // Next month days to fill the last row
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      cells.push({
        day,
        isCurrentMonth: false,
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        date: d,
      });
    }
  }

  // Group cells into weeks (rows of 7)
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden shadow-sm">
      {/* Header row */}
      <div className="grid grid-cols-8 bg-muted/60 border-b border-border/60">
        <div className="p-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          V.
        </div>
        {swedishDaysShort.map((day, i) => (
          <div
            key={day}
            className={`p-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider ${
              i >= 5 ? "text-muted-foreground/60" : "text-muted-foreground"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar rows */}
      {weeks.map((week, wi) => {
        const weekNum = getWeekNumber(week[0].date);
        const isLastWeek = wi === weeks.length - 1;

        return (
          <div
            key={wi}
            className={`grid grid-cols-8 ${!isLastWeek ? "border-b border-border/40" : ""}`}
          >
            {/* Week number */}
            <div className="flex items-start justify-center border-r border-border/40 bg-muted/30 p-1 pt-2.5 text-[0.65rem] font-medium text-muted-foreground">
              {weekNum}
            </div>

            {/* Day cells */}
            {week.map((cell, di) => {
              const isToday = cell.dateStr === todayStr;
              const isWeekend = di >= 5;
              const dayEvents = eventsByDate.get(cell.dateStr) ?? [];

              return (
                <div
                  key={cell.dateStr}
                  className={`min-h-[80px] md:min-h-[100px] p-1.5 transition-colors ${
                    di < 6 ? "border-r border-border/40" : ""
                  } ${isWeekend ? "bg-muted/20" : "bg-card"} ${
                    !cell.isCurrentMonth ? "opacity-35" : ""
                  } ${isToday ? "bg-primary/[0.04]" : ""}`}
                >
                  <div className="flex items-center mb-1">
                    {isToday ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[0.7rem] font-bold text-primary-foreground">
                        {cell.day}
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-medium pl-0.5 ${
                          cell.isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {cell.day}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/leveransplanering/${event.id}/redigera`}
                        className={`text-[0.65rem] leading-tight rounded-md px-1.5 py-0.5 font-medium truncate block hover:opacity-75 transition-opacity ${
                          eventTypeColors[event.type] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {event.project.name}
                        {event.time ? ` ${event.time}` : ""}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
