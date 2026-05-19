"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { swedishMonths } from "@/lib/format";

interface CalendarHeaderProps {
  year: number;
  month: number;
}

export function CalendarHeader({ year, month }: CalendarHeaderProps) {
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        render={
          <Link
            href={`/leveransplanering?year=${prevYear}&month=${prevMonth}`}
          />
        }
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        render={
          <Link
            href={`/leveransplanering?year=${currentYear}&month=${currentMonth}`}
          />
        }
      >
        Idag
      </Button>

      <Button
        variant="outline"
        size="sm"
        render={
          <Link
            href={`/leveransplanering?year=${nextYear}&month=${nextMonth}`}
          />
        }
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <h2 className="ml-2 text-lg font-semibold">
        {swedishMonths[month]} {year}
      </h2>
    </div>
  );
}
