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
  Receipt,
  TrendingUp,
  ShoppingCart,
  PackageCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/current-user";
import { formatDate } from "@/lib/format";
import { projectStatusLabels, projectStatusColors } from "@/lib/status-colors";

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
    uninvoicedAgg,
    pipelineQuotes,
    orderQuotes,
    completedDeliveries,
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
    prisma.timeEntry.aggregate({
      where: { invoiced: false },
      _sum: { hours: true },
    }),
    prisma.quote.findMany({
      where: { status: { in: ["draft", "sent", "accepted"] } },
      include: { items: { select: { quantity: true, unitPrice: true } } },
    }),
    prisma.quote.findMany({
      where: { status: "order" },
      include: { items: { select: { quantity: true, unitPrice: true } } },
    }),
    // Genomförda leveranser — APM 2026-08-31: Linda ska kunna se direkt på
    // startsidan vad som är levererat och därmed går att fakturera i Fortnox.
    prisma.deliveryEvent.findMany({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        customer: { select: { companyName: true } },
        completedBy: { select: { name: true } },
      },
      take: 10,
    }),
  ]);

  const hoursThisMonth = Number(timeEntriesAgg._sum.hours ?? 0);
  const uninvoicedHours = Number(uninvoicedAgg._sum.hours ?? 0);

  const sumQuoteValue = (quotes: typeof pipelineQuotes) =>
    quotes.reduce(
      (sum, q) =>
        sum +
        q.items.reduce(
          (s, item) => s + Number(item.quantity) * Number(item.unitPrice),
          0
        ),
      0
    );
  const pipelineCount = pipelineQuotes.length;
  const pipelineValue = sumQuoteValue(pipelineQuotes);
  const orderCount = orderQuotes.length;
  const orderValue = sumQuoteValue(orderQuotes);

  const todayStr = formatDate(now);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-primary">Hej! Här är din översikt</h1>
        <p className="text-sm font-medium text-muted-foreground">{todayStr}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-3 border-l-accent-green transition-colors hover:bg-accent-green-subtle/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktiva projekt</CardTitle>
            <div className="rounded-md bg-accent-green-subtle p-1.5">
              <FolderKanban className="h-4 w-4 text-accent-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">pågående</p>
          </CardContent>
        </Card>

        <Card className="border-l-3 border-l-accent-amber transition-colors hover:bg-accent-amber-subtle/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Timmar denna månad</CardTitle>
            <div className="rounded-md bg-accent-amber-subtle p-1.5">
              <Clock className="h-4 w-4 text-accent-amber" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hoursThisMonth.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">rapporterade</p>
          </CardContent>
        </Card>

        <Card className="border-l-3 border-l-accent-teal transition-colors hover:bg-accent-teal-subtle/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leveranser denna vecka</CardTitle>
            <div className="rounded-md bg-accent-teal-subtle p-1.5">
              <Truck className="h-4 w-4 text-accent-teal" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryCount}</div>
            <p className="text-xs text-muted-foreground">planerade</p>
          </CardContent>
        </Card>

        <Link href="/fakturaunderlag" className="block">
          <Card className="border-l-3 border-l-accent-rose transition-colors hover:bg-accent-rose-subtle/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ofakturerade timmar</CardTitle>
              <div className="rounded-md bg-accent-rose-subtle p-1.5">
                <Receipt className="h-4 w-4 text-accent-rose" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uninvoicedHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">att fakturera</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/offerter" className="block">
          <Card className="border-l-3 border-l-accent-blue transition-colors hover:bg-accent-blue-subtle/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Offerter i pipeline</CardTitle>
              <div className="rounded-md bg-accent-blue-subtle p-1.5">
                <TrendingUp className="h-4 w-4 text-accent-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pipelineCount} st</div>
              <p className="text-sm font-semibold text-accent-blue">
                {pipelineValue.toLocaleString("sv-SE")} kr
              </p>
              <p className="text-xs text-muted-foreground">utkast, skickade & accepterade</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/offerter?status=order" className="block">
          <Card className="border-l-3 border-l-accent-green transition-colors hover:bg-accent-green-subtle/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ordrar</CardTitle>
              <div className="rounded-md bg-accent-green-subtle p-1.5">
                <ShoppingCart className="h-4 w-4 text-accent-green" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderCount} st</div>
              <p className="text-sm font-semibold text-accent-green">
                {orderValue.toLocaleString("sv-SE")} kr
              </p>
              <p className="text-xs text-muted-foreground">bekräftade ordrar</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
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
          <Card className="border-l-3 border-l-accent-green">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-accent-green" />
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
          <Card className="border-l-3 border-l-accent-amber">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-accent-amber" />
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

      {completedDeliveries.length > 0 && (
        <Card className="border-l-3 border-l-accent-teal">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageCheck className="h-4 w-4 text-accent-teal" />
              Genomförda leveranser
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/leveransplanering" />}
            >
              Leveransplanering
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Klara att fakturera i Fortnox.
            </p>
            <div className="space-y-2">
              {completedDeliveries.map((d) => (
                <Link
                  key={d.id}
                  href={`/projekt/${d.project.id}`}
                  className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{d.project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.customer.companyName}
                      {d.completedBy?.name ? ` — ${d.completedBy.name}` : ""}
                    </p>
                  </div>
                  <span className="ml-3 whitespace-nowrap text-xs text-muted-foreground">
                    {d.completedAt ? formatDate(d.completedAt) : ""}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentProjects.length > 0 && (
        <Card className="border-l-3 border-l-accent-blue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4 text-accent-blue" />
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
                    <Badge className={projectStatusColors[project.status] ?? ""}>
                      {projectStatusLabels[project.status] ?? project.status}
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
