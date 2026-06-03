import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { CalendarHeader } from "@/components/delivery/calendar-header";
import { CalendarGrid } from "@/components/delivery/calendar-grid";
import { EventList } from "@/components/delivery/event-list";

const eventTypeLabels: Record<string, string> = {
  delivery: "Leverans",
  installation: "Installation",
  pickup: "Upphämtning",
};

const eventTypeColors: Record<string, string> = {
  delivery: "bg-blue-100 text-blue-800 border-blue-200",
  installation: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pickup: "bg-amber-100 text-amber-800 border-amber-200",
};

export default async function LeveransplaneringPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; view?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth();
  const view = params.view === "list" ? "list" : "calendar";

  // Fetch events for the displayed month
  const startOfMonth = new Date(year, month, 1);
  const startOfNextMonth = new Date(year, month + 1, 1);

  const events = await prisma.deliveryEvent.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
    include: {
      project: { select: { name: true } },
      customer: { select: { companyName: true } },
    },
    orderBy: { date: "asc" },
  });

  // Fetch upcoming events (next 7 days from today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const upcomingEvents = await prisma.deliveryEvent.findMany({
    where: {
      date: {
        gte: today,
        lt: sevenDaysFromNow,
      },
    },
    include: {
      project: { select: { name: true } },
      customer: { select: { companyName: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Leveransplanering</h1>
          <p className="text-muted-foreground">
            Planera leveranser, installationer och upphämtningar
          </p>
        </div>
        <Button render={<Link href="/leveransplanering/ny" />} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ny händelse
        </Button>
      </div>

      <CalendarHeader year={year} month={month} view={view} />

      {view === "calendar" ? (
        <CalendarGrid
          events={events.map((e) => ({
            ...e,
            date: new Date(e.date),
          }))}
          year={year}
          month={month}
        />
      ) : (
        <EventList
          events={events.map((e) => ({
            ...e,
            date: new Date(e.date),
          }))}
        />
      )}

      {/* Upcoming events */}
      <Card>
        <CardHeader>
          <CardTitle>Kommande händelser (7 dagar)</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Inga kommande händelser de närmaste 7 dagarna.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/leveransplanering/${event.id}/redigera`}
                  className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${
                      eventTypeColors[event.type] ??
                      "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {eventTypeLabels[event.type] ?? event.type}
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(event.date)}
                    {event.time ? ` kl. ${event.time}` : ""}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {event.project.name}
                  </span>
                  <span className="sm:ml-auto text-sm text-muted-foreground">
                    {event.customer.companyName}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
