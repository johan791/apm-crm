import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Calendar, Clock, Building, Plus, User, Users, Tag, Activity, MailIcon, FolderOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/projects/status-select";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { ActivityList } from "@/components/activities/activity-list";
import { QuickActivityForm } from "@/components/activities/quick-activity-form";
import { EmailLogList } from "@/components/email-logs/email-log-list";
import { QuickEmailForm } from "@/components/email-logs/quick-email-form";
import { ProjectFileList } from "@/components/projects/files/project-file-list";
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
      contact: true,
      responsibleUser: true,
      partners: { include: { partner: true } },
      activities: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
        include: { createdBy: true, assignedTo: true },
      },
      emailLogs: {
        orderBy: { sentAt: "desc" },
        include: { createdBy: true },
      },
      files: { orderBy: { createdAt: "desc" } },
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
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/kunder/${project.customer.id}`} />}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka till {project.customer.companyName}
        </Button>
        <span className="text-muted-foreground">·</span>
        <Button variant="ghost" size="sm" render={<Link href="/projekt" />}>
          Alla projekt
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1>{project.name}</h1>
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
            {project.contact && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Kontaktperson:</span>
                <span>
                  {project.contact.name}
                  {project.contact.role ? ` (${project.contact.role})` : ""}
                </span>
                {project.contact.email && (
                  <a
                    href={`mailto:${project.contact.email}`}
                    className="text-muted-foreground hover:underline"
                  >
                    {project.contact.email}
                  </a>
                )}
                {project.contact.phone && (
                  <a
                    href={`tel:${project.contact.phone}`}
                    className="text-muted-foreground hover:underline"
                  >
                    {project.contact.phone}
                  </a>
                )}
              </div>
            )}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-4 w-4 text-accent-amber" />
            Dokument ({project.files.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.onedriveFolderUrl && (
            <div className="flex items-center gap-2 rounded-md border border-accent-blue/30 bg-accent-blue-subtle/30 p-3">
              <FolderOpen className="h-4 w-4 text-accent-blue shrink-0" />
              <span className="text-sm flex-1">Projektmapp i OneDrive</span>
              <Button
                size="sm"
                variant="outline"
                render={
                  <a
                    href={project.onedriveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Öppna
              </Button>
            </div>
          )}
          <ProjectFileList projectId={project.id} files={project.files} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-accent-green" />
            Aktiviteter ({project.activities.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ActivityList activities={project.activities} />
          <QuickActivityForm projectId={project.id} customerId={project.customerId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MailIcon className="h-4 w-4 text-accent-blue" />
            Mail ({project.emailLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EmailLogList emails={project.emailLogs} />
          <QuickEmailForm projectId={project.id} customerId={project.customerId} />
        </CardContent>
      </Card>

      {project.partners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-accent-teal" />
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
