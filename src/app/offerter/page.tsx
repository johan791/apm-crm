import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatDate } from "@/lib/format";

const quoteStatusLabels: Record<string, string> = {
  draft: "Utkast",
  sent: "Skickad",
  accepted: "Accepterad",
  rejected: "Avvisad",
  order: "Order",
};

const quoteStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  sent: "secondary",
  accepted: "default",
  rejected: "destructive",
  order: "default",
};

export default async function OfferterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { customer: { companyName: { contains: q, mode: "insensitive" } } },
      { quoteNumber: isNaN(Number(q)) ? undefined : Number(q) },
    ].filter(Boolean);
  }
  if (status) {
    where.status = status;
  }

  const [quotes, pipelineCounts] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true, project: true, items: true },
    }),
    prisma.quote.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const pipeline = {
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    order: 0,
  };
  for (const row of pipelineCounts) {
    if (row.status in pipeline) {
      pipeline[row.status as keyof typeof pipeline] = row._count.status;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offerter</h1>
          <p className="text-muted-foreground">
            {quotes.length} {quotes.length === 1 ? "offert" : "offerter"}
          </p>
        </div>
        <Button render={<Link href="/offerter/ny" />}>
          <Plus className="mr-2 h-4 w-4" />
          Ny offert
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { key: "draft", label: "Utkast", color: "text-muted-foreground" },
          { key: "sent", label: "Skickade", color: "text-blue-600" },
          { key: "accepted", label: "Accepterade", color: "text-green-600" },
          { key: "rejected", label: "Avvisade", color: "text-red-500" },
          { key: "order", label: "Order", color: "text-primary" },
        ].map((stage) => (
          <Link key={stage.key} href={`/offerter?status=${stage.key}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stage.label}</p>
                <p className={`text-2xl font-bold ${stage.color}`}>
                  {pipeline[stage.key as keyof typeof pipeline]}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form className="flex max-w-sm gap-2 flex-1">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Sök kund eller offertnr..."
              defaultValue={q}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary">
            Sök
          </Button>
        </form>
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={!status ? "default" : "outline"}
            size="sm"
            render={<Link href={`/offerter${q ? `?q=${q}` : ""}`} />}
          >
            Alla
          </Button>
          {Object.entries(quoteStatusLabels).map(([value, label]) => (
            <Button
              key={value}
              variant={status === value ? "default" : "outline"}
              size="sm"
              render={
                <Link
                  href={`/offerter?status=${value}${q ? `&q=${q}` : ""}`}
                />
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {q || status
              ? "Inga offerter matchade filtret."
              : "Inga offerter ännu."}
          </p>
          {!q && !status && (
            <Button
              render={<Link href="/offerter/ny" />}
              className="mt-4"
            >
              Skapa din första offert
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offertnr</TableHead>
                <TableHead>Kund</TableHead>
                <TableHead className="hidden sm:table-cell">Projekt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Summa ex. moms</TableHead>
                <TableHead className="hidden md:table-cell">Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => {
                const sumExMoms = quote.items.reduce(
                  (sum, item) =>
                    sum +
                    Number(item.quantity) *
                      Number(item.unitPrice) *
                      (1 - Number(item.discount) / 100),
                  0
                );
                return (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link
                        href={`/offerter/${quote.id}`}
                        className="font-medium hover:underline"
                      >
                        #{quote.quoteNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/kunder/${quote.customer.id}`}
                        className="hover:underline text-muted-foreground"
                      >
                        {quote.customer.companyName}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {quote.project ? (
                        <Link
                          href={`/projekt/${quote.project.id}`}
                          className="hover:underline text-muted-foreground"
                        >
                          {quote.project.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={quoteStatusVariants[quote.status] ?? "outline"}
                      >
                        {quoteStatusLabels[quote.status] ?? quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sumExMoms)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(quote.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
