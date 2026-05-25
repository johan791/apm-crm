"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { swedishMonths } from "@/lib/format";

interface CalendarHeaderProps {
  year: number;
  month: number;
  view: string;
}

export function CalendarHeader({ year, month, view }: CalendarHeaderProps) {
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  function viewUrl(v: string, y: number, m: number) {
    return `/leveransplanering?year=${y}&month=${m}&view=${v}`;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        render={
          <Link href={viewUrl(view, prevYear, prevMonth)} />
        }
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        render={
          <Link href={viewUrl(view, currentYear, currentMonth)} />
        }
      >
        Idag
      </Button>

      <Button
        variant="outline"
        size="sm"
        render={
          <Link href={viewUrl(view, nextYear, nextMonth)} />
        }
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <h2 className="ml-2 text-lg font-semibold">
        {swedishMonths[month]} {year}
      </h2>

      <div className="ml-auto flex rounded-md border overflow-hidden">
        <Link
          href={viewUrl("calendar", year, month)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "calendar"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Kalender
        </Link>
        <Link
          href={viewUrl("list", year, month)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-l ${
            view === "list"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          <List className="h-4 w-4" />
          Lista
        </Link>
      </div>
    </div>
  );
}
