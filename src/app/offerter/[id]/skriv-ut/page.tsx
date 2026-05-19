import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { PrintButton } from "./print-button";

export default async function SkrivUtOffertPage({
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

  return (
    <div>
      {/* Navigation bar - hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/offerter/${quote.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
        <PrintButton />
      </div>

      {/* Print-optimized A4 layout */}
      <div className="mx-auto max-w-[210mm] rounded-md border bg-white p-8 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground text-lg font-bold">
                A
              </div>
              <div>
                <p className="text-lg font-bold leading-none">APM Project</p>
                <p className="text-xs text-muted-foreground">
                  Cirkulära möbler
                </p>
              </div>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-lg font-bold">
              {quote.status === "order" ? "Order" : "Offert"} #{quote.quoteNumber}
            </p>
            <p className="text-muted-foreground">
              Datum: {formatDate(quote.createdAt)}
            </p>
            {quote.validUntil && (
              <p className="text-muted-foreground">
                Giltig t.o.m. {formatDate(quote.validUntil)}
              </p>
            )}
          </div>
        </div>

        <hr className="my-6" />

        {/* Customer address */}
        <div className="text-sm">
          <p className="font-semibold">{quote.customer.companyName}</p>
          {quote.customer.contactPerson && (
            <p>{quote.customer.contactPerson}</p>
          )}
          {quote.customer.address && <p>{quote.customer.address}</p>}
          {(quote.customer.zipCode || quote.customer.city) && (
            <p>
              {[quote.customer.zipCode, quote.customer.city]
                .filter(Boolean)
                .join(" ")}
            </p>
          )}
        </div>

        {quote.project && (
          <p className="mt-2 text-sm text-muted-foreground">
            Projekt: {quote.project.name}
          </p>
        )}

        {/* Items table - NO cost prices, NO margins */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold">Beskrivning</th>
                <th className="pb-2 pr-4 font-semibold">Enhet</th>
                <th className="pb-2 pr-4 font-semibold text-right">Antal</th>
                <th className="pb-2 pr-4 font-semibold text-right">A-pris</th>
                <th className="pb-2 pr-4 font-semibold text-right">Rabatt</th>
                <th className="pb-2 font-semibold text-right">Summa</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item) => {
                const lineTotal =
                  Number(item.quantity) *
                  Number(item.unitPrice) *
                  (1 - Number(item.discount) / 100);
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{item.description}</td>
                    <td className="py-2 pr-4">
                      {item.unit === "m2" ? "m²" : item.unit}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {Number(item.quantity)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {formatCurrency(Number(item.unitPrice))}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {Number(item.discount) > 0
                        ? `${Number(item.discount)}%`
                        : "–"}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Summa</span>
              <span className="font-medium">{formatCurrency(sumExMoms)}</span>
            </div>
            <div className="flex justify-between">
              <span>Moms 25%</span>
              <span className="font-medium">{formatCurrency(moms)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Totalt</span>
              <span>{formatCurrency(totalInkMoms)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        {(quote.paymentTerms || quote.deliveryTerms) && (
          <div className="mt-8 space-y-3 text-sm">
            <h3 className="font-semibold">Villkor</h3>
            {quote.paymentTerms && (
              <div>
                <p className="font-medium">Betalningsvillkor</p>
                <p className="text-muted-foreground">{quote.paymentTerms}</p>
              </div>
            )}
            {quote.deliveryTerms && (
              <div>
                <p className="font-medium">Leveransvillkor</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {quote.deliveryTerms}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="mt-6 text-sm">
            <h3 className="font-semibold">Anteckningar</h3>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {quote.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
