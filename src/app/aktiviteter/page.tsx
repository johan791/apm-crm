import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/current-user";
import { ActivityList } from "@/components/activities/activity-list";

export default async function AktiviteterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; typ?: string; visa?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? "oppen";
  const typFilter = params.typ;
  const visaFilter = params.visa ?? "alla";

  const userId = await currentUserId();

  const where: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "alla") {
    where.status = statusFilter;
  }
  if (typFilter) {
    where.type = typFilter;
  }
  if (visaFilter === "mina") {
    where.OR = [{ createdById: userId }, { assignedToId: userId }];
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy: true,
      assignedTo: true,
      customer: { select: { id: true, companyName: true } },
      project: { select: { id: true, name: true } },
    },
  });

  const statusOptions = [
    { value: "oppen", label: "Öppna" },
    { value: "klar", label: "Klara" },
    { value: "alla", label: "Alla" },
  ];

  const typeOptions = [
    { value: "", label: "Alla typer" },
    { value: "anteckning", label: "Anteckningar" },
    { value: "samtal", label: "Samtal" },
    { value: "mote", label: "Möten" },
    { value: "mejl", label: "Mail" },
    { value: "uppgift", label: "Uppgifter" },
    { value: "uppfoljning", label: "Uppföljningar" },
  ];

  function filterUrl(overrides: { visa?: string; status?: string; typ?: string }) {
    const v = overrides.visa ?? visaFilter;
    const s = overrides.status ?? statusFilter;
    const t = overrides.typ ?? typFilter;
    let url = `/aktiviteter?visa=${v}&status=${s}`;
    if (t) url += `&typ=${t}`;
    return url;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Aktiviteter</h1>
          <p className="text-muted-foreground">
            {activities.length}{" "}
            {activities.length === 1 ? "aktivitet" : "aktiviteter"}
          </p>
        </div>
        <Button render={<Link href="/aktiviteter/ny" />} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ny aktivitet
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
        <div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Visa</span>
          <div className="flex gap-1">
            {[
              { value: "mina", label: "Mina" },
              { value: "alla", label: "Alla" },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant={visaFilter === opt.value ? "default" : "outline"}
                size="sm"
                render={<Link href={filterUrl({ visa: opt.value })} />}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Status</span>
          <div className="flex gap-1">
            {statusOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={statusFilter === opt.value ? "default" : "outline"}
                size="sm"
                render={<Link href={filterUrl({ status: opt.value })} />}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Typ</span>
          <div className="flex gap-1 flex-wrap">
            {typeOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={(typFilter ?? "") === opt.value ? "default" : "outline"}
                size="sm"
                render={<Link href={filterUrl({ typ: opt.value })} />}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {activities.map((activity) => (
          <div key={activity.id} className="group/card">
            <div className="space-y-0">
              <ActivityList
                activities={[activity]}
                context={
                  activity.customer || activity.project
                    ? {
                        customer: activity.customer,
                        project: activity.project,
                      }
                    : undefined
                }
              />
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">Inga aktiviteter</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Inga aktiviteter matchade filtret.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
