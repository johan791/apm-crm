import Link from "next/link";
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Clock,
  FileText,
  Truck,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/current-user";
import { formatDate } from "@/lib/format";

const statusLabels: Record<string, string> = {
  active: "Aktivt",
  completed: "Avslutat",
  paused: "Pausat",
  cancelled: "Avbrutet",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  completed: "secondary",
  paused: "outline",
  cancelled: "destructive",
};

export default async function DashboardPage() {
  const userId = await currentUserId();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [
    activeProjects,
    recentProjects,
    timeEntriesAgg,
    pendingQuoteCount,
    deliveryCount,
    weekActivities,
    unlinkedActivities,
  ] = await Promise.all([
    prisma.project.count({ where: { status: "active" } }),
    prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { customer: true },
    }),
    prisma.timeEntry.aggregate({
      _sum: { hours: true },
      where: { date: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.quote.count({ where: { status: { in: ["sent", "accepted"] } } }),
    prisma.deliveryEvent.count({
      where: { date: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.activity.findMany({
      where: {
        status: "oppen",
        dueDate: { gte: weekStart, lt: weekEnd },
        OR: [{ createdById: userId }, { assignedToId: userId }],
      },
      orderBy: { dueDate: "asc" },
      include: {
        customer: { select: { id: true, companyName: true } },
        project: { select: { id: true, name: true } },
      },
      take: 10,
    }),
    prisma.activity.findMany({
      where: {
        status: "oppen",
        customerId: null,
        projectId: null,
      },
      orderBy: { createdAt: "desc" },
      include: { createdBy: true },
      take: 10,
    }),
  ]);

  const hoursThisMonth = Number(timeEntriesAgg._sum.hours ?? 0);

  const todayStr = formatDate(now);

  return (
    <div className="space-y-8">
      <div>
        <h1>Hej! Här är din översikt</h1>
        <p className="text-muted-foreground">{todayStr}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-colors hover:bg-accent/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktiva projekt</CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">pågående</p>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:bg-accent/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Timmar denna månad</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hoursThisMonth.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">rapporterade</p>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:bg-accent/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offerter att följa upp</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingQuoteCount}</div>
            <p className="text-xs text-muted-foreground">skickade & accepterade</p>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:bg-accent/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leveranser denna vecka</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryCount}</div>
            <p className="text-xs text-muted-foreground">planerade</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button render={<Link href="/kunder/ny" />}>
          <Plus className="mr-2 h-4 w-4" />
          Ny kund
        </Button>
        <Button variant="outline" render={<Link href="/projekt/nytt" />}>
          <Plus className="mr-2 h-4 w-4" />
          Nytt projekt
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {weekActivities.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Mina aktiviteter denna vecka
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/aktiviteter?visa=mina" />}
              >
                Visa alla
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weekActivities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{a.title ?? a.description.slice(0, 60)}</p>
                      {a.customer && (
                        <p className="text-xs text-muted-foreground">{a.customer.companyName}</p>
                      )}
                    </div>
                    {a.dueDate && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                        {formatDate(a.dueDate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {unlinkedActivities.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Okopplade anteckningar
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/aktiviteter?status=oppen" />}
              >
                Visa alla
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unlinkedActivities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{a.title ?? a.description.slice(0, 60)}</p>
                      {a.createdBy && (
                        <p className="text-xs text-muted-foreground">{a.createdBy.name}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {formatDate(a.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {recentProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Senast uppdaterade projekt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projekt/${project.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.customer.companyName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusVariants[project.status] ?? "outline"}
                    >
                      {statusLabels[project.status] ?? project.status}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
