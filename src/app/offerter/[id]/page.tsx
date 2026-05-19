import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Printer, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { DeleteQuoteButton } from "@/components/quotes/delete-quote-button";
import { convertToOrder } from "@/lib/actions/quotes";

export default async function OffertDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      project: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!quote) notFound();

  const sumExMoms = quote.items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity) *
        Number(item.unitPrice) *
        (1 - Number(item.discount) / 100),
    0
  );
  const moms = sumExMoms * 0.25;
  const totalInkMoms = sumExMoms + moms;

  const totalCost = quote.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.costPrice),
    0
  );
  const marginKr = sumExMoms - totalCost;
  const marginPercent = sumExMoms > 0 ? (marginKr / sumExMoms) * 100 : 0;

  const convertWithId = convertToOrder.bind(null, quote.id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/offerter" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till offerter
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              Offert #{quote.quoteNumber}
            </h1>
            <QuoteStatusSelect
              quoteId={quote.id}
              currentStatus={quote.status}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <Link
              href={`/kunder/${quote.customer.id}`}
              className="hover:underline"
            >
              {quote.customer.companyName}
            </Link>
            {quote.project && (
              <Link
                href={`/projekt/${quote.project.id}`}
                className="hover:underline"
              >
                {quote.project.name}
              </Link>
            )}
            <span>Skapad {formatDate(quote.createdAt)}</span>
            {quote.validUntil && (
              <span>Giltig t.o.m. {formatDate(quote.validUntil)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/offerter/${quote.id}/redigera`} />}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Redigera
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/offerter/${quote.id}/skriv-ut`} />}
          >
            <Printer className="mr-2 h-4 w-4" />
            Skriv ut
          </Button>
          {quote.status === "accepted" && (
            <form action={convertWithId}>
              <Button type="submit" size="sm">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Konvertera till order
              </Button>
            </form>
          )}
          <DeleteQuoteButton id={quote.id} />
        </div>
      </div>

      {/* Customer & project info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kunduppgifter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{quote.customer.companyName}</p>
            {quote.customer.contactPerson && (
              <p className="text-muted-foreground">{quote.customer.contactPerson}</p>
            )}
            {quote.customer.address && (
              <p className="text-muted-foreground">{quote.customer.address}</p>
            )}
            {(quote.customer.zipCode || quote.customer.city) && (
              <p className="text-muted-foreground">
                {[quote.customer.zipCode, quote.customer.city]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
            {quote.customer.email && (
              <p className="text-muted-foreground">{quote.customer.email}</p>
            )}
            {quote.customer.phone && (
              <p className="text-muted-foreground">{quote.customer.phone}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Villkor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {quote.paymentTerms && (
              <div>
                <p className="text-muted-foreground">Betalningsvillkor</p>
                <p>{quote.paymentTerms}</p>
              </div>
            )}
            {quote.deliveryTerms && (
              <div>
                <p className="text-muted-foreground">Leveransvillkor</p>
                <p className="whitespace-pre-wrap">{quote.deliveryTerms}</p>
              </div>
            )}
            {quote.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Anteckningar</p>
                  <p className="whitespace-pre-wrap">{quote.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items table */}
      {quote.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offertrader</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beskrivning</TableHead>
                    <TableHead>Enhet</TableHead>
                    <TableHead className="text-right">Antal</TableHead>
                    <TableHead className="text-right">A-pris</TableHead>
                    <TableHead className="text-right">Rabatt</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.items.map((item) => {
                    const lineTotal =
                      Number(item.quantity) *
                      Number(item.unitPrice) *
                      (1 - Number(item.discount) / 100);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.unit === "m2" ? "m²" : item.unit}</TableCell>
                        <TableCell className="text-right">
                          {Number(item.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(item.unitPrice))}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(item.discount) > 0
                            ? `${Number(item.discount)}%`
                            : "–"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(lineTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Summa ex. moms</span>
                  <span className="font-medium">{formatCurrency(sumExMoms)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moms 25%</span>
                  <span className="font-medium">{formatCurrency(moms)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 text-base font-semibold">
                  <span>Totalt inkl. moms</span>
                  <span>{formatCurrency(totalInkMoms)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal margin card */}
      {quote.items.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-base">Intern marginalkalkyl</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Kostnad</p>
                <p className="font-medium">{formatCurrency(totalCost)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Försäljning</p>
                <p className="font-medium">{formatCurrency(sumExMoms)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Marginal (kr)</p>
                <p className="font-medium">{formatCurrency(marginKr)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Marginal (%)</p>
                <p className="font-medium">{marginPercent.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
