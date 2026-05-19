"use client";

import Link from "next/link";
import { getWeekNumber, swedishDaysShort } from "@/lib/format";

const eventTypeColors: Record<string, string> = {
  delivery: "bg-blue-100 text-blue-800 border-blue-200",
  installation: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pickup: "bg-amber-100 text-amber-800 border-amber-200",
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
    <div className="grid grid-cols-8 gap-px rounded-lg border bg-border overflow-hidden">
      {/* Header row */}
      <div className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
        V.
      </div>
      {swedishDaysShort.map((day, i) => (
        <div
          key={day}
          className={`p-2 text-center text-xs font-medium ${
            i >= 5
              ? "bg-muted/70 text-muted-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {day}
        </div>
      ))}

      {/* Calendar rows */}
      {weeks.map((week, wi) => {
        // Use the Monday of this week (first cell) for week number
        const weekNum = getWeekNumber(week[0].date);

        return (
          <div key={wi} className="contents">
            {/* Week number */}
            <div className="flex items-start justify-center bg-muted/50 p-1 pt-2 text-xs font-medium text-muted-foreground">
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
                  className={`min-h-[80px] md:min-h-[100px] p-1 ${
                    isWeekend ? "bg-muted/30" : "bg-card"
                  } ${!cell.isCurrentMonth ? "opacity-40" : ""} ${
                    isToday ? "ring-2 ring-primary ring-inset" : ""
                  }`}
                >
                  <div
                    className={`text-xs font-medium mb-0.5 ${
                      isToday
                        ? "text-primary font-bold"
                        : cell.isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {cell.day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/leveransplanering/${event.id}/redigera`}
                        className={`text-[0.65rem] leading-tight rounded px-1 py-0.5 border truncate block hover:opacity-80 transition-opacity ${
                          eventTypeColors[event.type] ?? "bg-gray-100 text-gray-800 border-gray-200"
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
