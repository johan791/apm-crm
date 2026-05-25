import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDate, formatHours, formatCurrency } from "@/lib/format";
import { DeleteTimeEntryButton } from "@/components/time-entries/delete-time-entry-button";

export default async function ProjektTidPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      timeEntries: { orderBy: { date: "desc" } },
    },
  });

  if (!project) notFound();

  const totalHours = project.timeEntries.reduce(
    (sum, e) => sum + Number(e.hours),
    0
  );
  const totalAmount = project.hourlyRate
    ? totalHours * Number(project.hourlyRate)
    : null;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/projekt/${project.id}`} />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till projekt
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1>Tidrapportering — {project.name}</h1>
          <Link
            href={`/kunder/${project.customer.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {project.customer.companyName}
          </Link>
        </div>
        <Button render={<Link href={`/projekt/${project.id}/tid/ny`} />}>
          <Plus className="mr-2 h-4 w-4" />
          Ny tidspost
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Totalt timmar</p>
              <p className="text-lg font-semibold">{formatHours(totalHours)}</p>
            </div>
          </CardContent>
        </Card>
        {totalAmount !== null && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Totalt belopp</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {project.timeEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Clock className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">Inga tidsposter</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Kom igång genom att skapa din första tidspost för detta projekt.
          </p>
          <Button
            render={<Link href={`/projekt/${project.id}/tid/ny`} />}
            className="mt-4"
          >
            Skapa din första tidspost
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Timmar</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Beskrivning
                </TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.timeEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(entry.date)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatHours(entry.hours)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell max-w-xs truncate text-muted-foreground">
                    {entry.description ?? "–"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <Link
                            href={`/projekt/${project.id}/tid/${entry.id}/redigera`}
                          />
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Redigera
                      </Button>
                      <DeleteTimeEntryButton
                        id={entry.id}
                        projectId={project.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
