import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatDate, formatHours, formatCurrency } from "@/lib/format";

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

export default async function FakturaunderlagPage() {
  const bases = await prisma.invoiceBasis.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: { include: { customer: true } },
      createdBy: true,
      _count: { select: { timeEntries: true } },
    },
  });

  const uninvoicedAgg = await prisma.timeEntry.aggregate({
    where: { invoiced: false },
    _sum: { hours: true },
    _count: true,
  });

  const uninvoicedHours = Number(uninvoicedAgg._sum.hours ?? 0);
  const uninvoicedCount = uninvoicedAgg._count;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Fakturaunderlag</h1>
          <p className="text-muted-foreground">
            {uninvoicedCount} ofakturerade tidsposter ({formatHours(uninvoicedHours)})
          </p>
        </div>
        <Button render={<Link href="/fakturaunderlag/nytt" />} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nytt underlag
        </Button>
      </div>

      {bases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">Inga fakturaunderlag</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Skapa ditt första fakturaunderlag från tidrapporterade timmar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {bases.map((basis) => (
            <Link
              key={basis.id}
              href={`/fakturaunderlag/${basis.id}`}
              className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-accent"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    Underlag #{basis.number}
                  </span>
                  <Badge variant={statusVariants[basis.status] ?? "outline"}>
                    {statusLabels[basis.status] ?? basis.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {basis.project.customer.companyName} — {basis.project.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(basis.periodFrom)} – {formatDate(basis.periodTo)} · {basis._count.timeEntries} poster
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatHours(basis.totalHours)}</p>
                {basis.totalAmount && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(basis.totalAmount)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
