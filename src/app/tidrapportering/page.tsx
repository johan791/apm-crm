import Link from "next/link";
import { Plus, Search, Clock, Calendar, TrendingUp, Printer, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate, formatHours } from "@/lib/format";
import { DeleteTimeEntryIconButton } from "@/components/time-entries/delete-time-entry-icon-button";
import { PrintButton } from "@/components/invoice-basis/print-button";

export default async function TidrapporteringPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { project: { name: { contains: q, mode: "insensitive" } } },
      {
        project: {
          customer: { companyName: { contains: q, mode: "insensitive" } },
        },
      },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const timeEntries = await prisma.timeEntry.findMany({
    where,
    orderBy: { date: "desc" },
    include: { project: { include: { customer: true } } },
  });

  const totalHours = timeEntries.reduce(
    (sum, e) => sum + Number(e.hours),
    0
  );

  const uniqueDays = new Set(
    timeEntries.map((e) => e.date.toISOString().slice(0, 10))
  ).size;

  const avgPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Tidrapportering</h1>
          <p className="text-muted-foreground">
            {timeEntries.length}{" "}
            {timeEntries.length === 1 ? "tidspost" : "tidsposter"}
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <PrintButton label="Skriv ut" />
          <Button render={<Link href="/tidrapportering/ny" />}>
            <Plus className="mr-2 h-4 w-4" />
            Registrera tid
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-3 border-l-accent-amber">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-md bg-accent-amber-subtle p-1.5">
              <Clock className="h-4 w-4 text-accent-amber" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Totalt timmar</p>
              <p className="text-xl font-semibold">{formatHours(totalHours)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-3 border-l-accent-blue">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-md bg-accent-blue-subtle p-1.5">
              <Calendar className="h-4 w-4 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Antal dagar</p>
              <p className="text-xl font-semibold">{uniqueDays}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-3 border-l-accent-teal">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-md bg-accent-teal-subtle p-1.5">
              <TrendingUp className="h-4 w-4 text-accent-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Snitt per dag</p>
              <p className="text-xl font-semibold">{formatHours(avgPerDay)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <form className="flex max-w-sm gap-2 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Sök projekt, kund eller beskrivning..."
            defaultValue={q}
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">
          Sök
        </Button>
      </form>

      {timeEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Clock className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">Inga tidsposter</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {q
              ? "Inga tidsposter matchade sökningen."
              : "Kom igång genom att skapa din första tidspost."}
          </p>
          {!q && (
            <Button
              render={<Link href="/tidrapportering/ny" />}
              className="mt-4"
            >
              Skapa din första tidspost
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Kund</TableHead>
                <TableHead className="hidden sm:table-cell">Projekt</TableHead>
                <TableHead className="text-right">Timmar</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Anteckningar
                </TableHead>
                <TableHead className="text-right print:hidden">
                  <span className="sr-only">Åtgärder</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(entry.date)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/kunder/${entry.project.customer.id}`}
                      className="hover:underline"
                    >
                      {entry.project.customer.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Link
                      href={`/projekt/${entry.project.id}`}
                      className="font-medium hover:underline"
                    >
                      {entry.project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatHours(entry.hours)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {entry.invoiced && (
                      <Badge className="bg-status-active-bg text-status-active border-transparent text-xs">Fakturerad</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                    {entry.description ?? "–"}
                  </TableCell>
                  <TableCell className="text-right print:hidden">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        render={<Link href={`/tidrapportering/${entry.id}/redigera`} />}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <DeleteTimeEntryIconButton
                        id={entry.id}
                        projectId={entry.projectId}
                        returnTo="/tidrapportering"
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
