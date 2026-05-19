import Link from "next/link";
import { Plus, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tidrapportering
          </h1>
          <p className="text-muted-foreground">
            {timeEntries.length}{" "}
            {timeEntries.length === 1 ? "tidspost" : "tidsposter"}
          </p>
        </div>
        <Button render={<Link href="/tidrapportering/ny" />}>
          <Plus className="mr-2 h-4 w-4" />
          Ny tidspost
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Totalt</p>
            <p className="text-lg font-semibold">{formatHours(totalHours)}</p>
          </div>
        </CardContent>
      </Card>

      <form className="flex max-w-sm gap-2">
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
                <TableHead>Projekt</TableHead>
                <TableHead className="hidden sm:table-cell">Kund</TableHead>
                <TableHead className="text-right">Timmar</TableHead>
                <TableHead className="hidden md:table-cell">
                  Beskrivning
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
                      href={`/projekt/${entry.project.id}/tid`}
                      className="font-medium hover:underline"
                    >
                      {entry.project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    <Link
                      href={`/kunder/${entry.project.customer.id}`}
                      className="hover:underline"
                    >
                      {entry.project.customer.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatHours(entry.hours)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                    {entry.description ?? "–"}
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
