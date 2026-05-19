import Link from "next/link";
import {
  Users,
  FolderKanban,
  Plus,
  ArrowRight,
  Clock,
  FileText,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Week boundaries (Monday to Sunday)
  const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [
    customerCount,
    projectCount,
    activeProjects,
    recentProjects,
    timeEntriesAgg,
    activeQuoteCount,
    deliveryCount,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.project.count(),
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
    prisma.quote.count({ where: { status: { not: "draft" } } }),
    prisma.deliveryEvent.count({
      where: { date: { gte: weekStart, lt: weekEnd } },
    }),
  ]);

  const hoursThisMonth = Number(timeEntriesAgg._sum.hours ?? 0);

  const todayStr = formatDate(now);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hej! Här är din översikt
        </h1>
        <p className="text-muted-foreground">{todayStr}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kunder</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-muted-foreground">registrerade kunder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projekt</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">totalt antal projekt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktiva</CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">pågående projekt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Timmar denna månad
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hoursThisMonth.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">rapporterade timmar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Aktiva offerter
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeQuoteCount}</div>
            <p className="text-xs text-muted-foreground">ej utkast</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Leveranser denna vecka
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <Truck className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryCount}</div>
            <p className="text-xs text-muted-foreground">planerade leveranser</p>
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
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.customer.companyName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        project.status === "active" ? "default" : "secondary"
                      }
                    >
                      {project.status === "active"
                        ? "Aktiv"
                        : project.status === "completed"
                          ? "Klar"
                          : project.status === "cancelled"
                            ? "Avbruten"
                            : project.status}
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
