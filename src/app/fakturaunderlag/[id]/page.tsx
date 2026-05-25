import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ReopenButton } from "@/components/invoice-basis/reopen-button";
import { PrintButton } from "@/components/invoice-basis/print-button";

const statusLabels: Record<string, string> = {
  skapad: "Skapad",
  skickad: "Skickad",
  betald: "Betald",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  skapad: "outline",
  skickad: "secondary",
  betald: "default",
};

export default async function FakturaunderlagDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const basis = await prisma.invoiceBasis.findUnique({
    where: { id },
    include: {
      project: { include: { customer: true } },
      createdBy: true,
      timeEntries: { orderBy: { date: "asc" } },
    },
  });

  if (!basis) notFound();

  const hourlyRate = basis.project.hourlyRate
    ? Number(basis.project.hourlyRate)
    : null;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/fakturaunderlag" />}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1>Fakturaunderlag #{basis.number}</h1>
            <Badge variant={statusVariants[basis.status] ?? "outline"}>
              {statusLabels[basis.status] ?? basis.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {basis.project.customer.companyName} — {basis.project.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Period: {formatDate(basis.periodFrom)} – {formatDate(basis.periodTo)}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={`/api/fakturaunderlag/${basis.id}/csv`} download="fakturaunderlag.csv" />
            }
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <PrintButton />
          <ReopenButton id={basis.id} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Totalt timmar</p>
            <p className="text-2xl font-bold">{formatHours(basis.totalHours)}</p>
          </CardContent>
        </Card>
        {basis.totalAmount && (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Belopp</p>
              <p className="text-2xl font-bold">{formatCurrency(basis.totalAmount)}</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Antal poster</p>
            <p className="text-2xl font-bold">{basis.timeEntries.length}</p>
          </CardContent>
        </Card>
      </div>

      {basis.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anteckningar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{basis.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tidsposter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Timmar</TableHead>
                  {hourlyRate && <TableHead className="text-right">Belopp</TableHead>}
                  <TableHead>Beskrivning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {basis.timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatHours(entry.hours)}
                    </TableCell>
                    {hourlyRate && (
                      <TableCell className="text-right">
                        {formatCurrency(Number(entry.hours) * hourlyRate)}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {entry.description ?? "–"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground print:hidden">
        Skapad av {basis.createdBy.name} den {formatDate(basis.createdAt)}
      </p>
    </div>
  );
}
