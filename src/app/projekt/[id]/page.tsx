import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Calendar, Clock, Building, Plus, User, Users, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/projects/status-select";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { formatDate as fmtDate, formatHours, formatCurrency } from "@/lib/format";

function formatDate(date: Date | null) {
  if (!date) return "–";
  return date.toLocaleDateString("sv-SE");
}

const categoryLabels: Record<string, string> = {
  logistics: "Logistik",
  carpentry: "Snickeri",
  upholstery: "Klädsel",
  demolition: "Demontering",
  refurbishment: "Renovering",
  architect: "Arkitekt",
  other: "Övrigt",
};

export default async function ProjektDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      responsibleUser: true,
      partners: { include: { partner: true } },
      timeEntries: { orderBy: { date: "desc" }, take: 5 },
    },
  });

  if (!project) notFound();

  const timeAgg = await prisma.timeEntry.aggregate({
    where: { projectId: id },
    _sum: { hours: true },
    _count: true,
  });

  const totalHours = Number(timeAgg._sum.hours ?? 0);
  const totalEntries = timeAgg._count;
  const totalAmount = project.hourlyRate
    ? totalHours * Number(project.hourlyRate)
    : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/projekt" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till projekt
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <StatusSelect
              projectId={project.id}
              currentStatus={project.status}
            />
          </div>
          <Link
            href={`/kunder/${project.customer.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {project.customer.companyName}
          </Link>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/projekt/${project.id}/redigera`} />}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Redigera
          </Button>
          <DeleteProjectButton id={project.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projektdetaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.description && (
              <>
                <p className="text-sm whitespace-pre-wrap">
                  {project.description}
                </p>
                <Separator />
              </>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Kund:</span>
              <Link
                href={`/kunder/${project.customer.id}`}
                className="hover:underline"
              >
                {project.customer.companyName}
              </Link>
            </div>
            {project.responsibleUser && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ansvarig:</span>
                {project.responsibleUser.name}
              </div>
            )}
            {project.hourlyRate && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Timpris:</span>
                {project.hourlyRate.toString()} kr
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Period:</span>
              {formatDate(project.startDate)} — {formatDate(project.endDate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tidrapportering</CardTitle>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/projekt/${project.id}/tid`} />}
            >
              Visa alla
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Timmar</p>
                <p className="font-semibold">{formatHours(totalHours)}</p>
              </div>
              {totalAmount !== null && (
                <div>
                  <p className="text-muted-foreground">Belopp</p>
                  <p className="font-semibold">{formatCurrency(totalAmount)}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Poster</p>
                <p className="font-semibold">{totalEntries}</p>
              </div>
            </div>

            {project.timeEntries.length > 0 ? (
              <div className="space-y-2">
                {project.timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex gap-3">
                      <span className="text-muted-foreground whitespace-nowrap">
                        {fmtDate(entry.date)}
                      </span>
                      <span className="truncate max-w-[200px]">
                        {entry.description ?? "–"}
                      </span>
                    </div>
                    <span className="font-medium whitespace-nowrap">
                      {formatHours(entry.hours)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Inga tidsposter ännu.
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/projekt/${project.id}/tid/ny`} />}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ny tidspost
            </Button>
          </CardContent>
        </Card>
      </div>

      {project.partners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Partners ({project.partners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.partners.map((pp) => (
                <div
                  key={pp.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/partners/${pp.partner.id}`}
                      className="font-medium hover:underline"
                    >
                      {pp.partner.companyName}
                    </Link>
                    <Badge variant="secondary">
                      {categoryLabels[pp.partner.category] ?? pp.partner.category}
                    </Badge>
                  </div>
                  {pp.role && (
                    <span className="text-sm text-muted-foreground">
                      {pp.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
