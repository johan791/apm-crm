import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Calendar, Clock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { StatusSelect } from "@/components/projects/status-select";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";

function formatDate(date: Date | null) {
  if (!date) return "–";
  return date.toLocaleDateString("sv-SE");
}

export default async function ProjektDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!project) notFound();

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
          <CardHeader>
            <CardTitle className="text-base">Kommande moduler</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Tidrapportering</li>
              <li>Offerter & order</li>
              <li>Leverantörsfakturor</li>
              <li>Filhantering</li>
              <li>Leveransplanering</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
