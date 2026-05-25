import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ActivityList } from "@/components/activities/activity-list";

export default async function AktiviteterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; typ?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? "oppen";
  const typFilter = params.typ;

  const where: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "alla") {
    where.status = statusFilter;
  }
  if (typFilter) {
    where.type = typFilter;
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
    { value: "mejl", label: "Mejl" },
    { value: "uppgift", label: "Uppgifter" },
    { value: "uppfoljning", label: "Uppföljningar" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Aktiviteter</h1>
          <p className="text-muted-foreground">
            {activities.length}{" "}
            {activities.length === 1 ? "aktivitet" : "aktiviteter"}
          </p>
        </div>
        <Button render={<Link href="/aktiviteter/ny" />}>
          <Plus className="mr-2 h-4 w-4" />
          Ny aktivitet
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={statusFilter === opt.value ? "default" : "outline"}
            size="sm"
            render={
              <Link
                href={`/aktiviteter?status=${opt.value}${typFilter ? `&typ=${typFilter}` : ""}`}
              />
            }
          >
            {opt.label}
          </Button>
        ))}
        <span className="mx-2 border-l" />
        {typeOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={
              (typFilter ?? "") === opt.value ? "default" : "outline"
            }
            size="sm"
            render={
              <Link
                href={`/aktiviteter?status=${statusFilter}${opt.value ? `&typ=${opt.value}` : ""}`}
              />
            }
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {activities.map((activity) => (
          <div key={activity.id} className="space-y-1">
            {(activity.customer || activity.project) && (
              <div className="flex gap-2 text-xs text-muted-foreground px-1">
                {activity.customer && (
                  <Link
                    href={`/kunder/${activity.customer.id}`}
                    className="hover:underline"
                  >
                    {activity.customer.companyName}
                  </Link>
                )}
                {activity.customer && activity.project && <span>/</span>}
                {activity.project && (
                  <Link
                    href={`/projekt/${activity.project.id}`}
                    className="hover:underline"
                  >
                    {activity.project.name}
                  </Link>
                )}
              </div>
            )}
            <ActivityList activities={[activity]} />
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
