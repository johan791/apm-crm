import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatAmount, formatDate } from "@/lib/format";
import { company, defaultTerms } from "@/lib/company";
import { PrintButton } from "./print-button";

/**
 * Utskrift av offert / orderbekräftelse i samma uppställning som APM:s
 * Fortnox-mallar, så att kunden känner igen dokumentet oavsett vilket
 * system det kommer ur.
 */
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
      contact: true,
      project: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!quote) notFound();

  const isOrder = quote.status === "order";
  const title = isOrder ? "Orderbekräftelse" : "Offert";

  const lineTotal = (item: (typeof quote.items)[number]) =>
    Number(item.quantity) *
    Number(item.unitPrice) *
    (1 - Number(item.discount) / 100);

  const sumExMoms = quote.items.reduce((sum, item) => sum + lineTotal(item), 0);
  const moms = sumExMoms * defaultTerms.vatRate;
  const totalIncMoms = sumExMoms + moms;

  const hasDiscount = quote.items.some((item) => Number(item.discount) > 0);

  // Kolumnerna följer Fortnox: orderbekräftelsen har en extra "Lev ant".
  const meta: Array<{ label: string; value: string }> = [
    { label: "Kundnr", value: quote.customer.customerNumber ?? "–" },
    { label: "Vår referens", value: quote.ourReference ?? "–" },
    ...(quote.yourReference
      ? [{ label: "Er referens", value: quote.yourReference }]
      : []),
    {
      label: "Betalningsvillkor",
      value: quote.paymentTerms ?? defaultTerms.paymentTerms,
    },
    ...(isOrder
      ? []
      : [
          {
            label: "Giltig tom",
            value: quote.validUntil ? formatDate(quote.validUntil) : "–",
          },
        ]),
    { label: "Dröjsmålsränta", value: defaultTerms.lateInterest },
    ...(quote.deliveryDate
      ? [{ label: "Leveransdatum", value: formatDate(quote.deliveryDate) }]
      : []),
    ...(isOrder
      ? [{ label: "Vårt offertnr", value: String(quote.quoteNumber) }]
      : []),
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/offerter/${quote.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Förhandsgranskning — så här ser {title.toLowerCase()}en ut utskriven
          </span>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto max-w-[210mm] rounded-md border bg-white p-10 text-[13px] leading-snug text-black shadow-sm print:border-none print:p-0 print:shadow-none">
        {/* Sidhuvud: avsändare till vänster, dokumenttyp och nummer till höger */}
        <div className="flex items-start justify-between gap-8">
          <div>
            {/* Ordmärket ingår i logotypen, så inget företagsnamn intill. */}
            <Image
              src={company.logo.src}
              alt={company.brandName}
              width={company.logo.width}
              height={company.logo.height}
              priority
              className="h-auto w-[180px]"
            />
          </div>
          <div className="min-w-[240px]">
            <p className="text-2xl font-semibold">{title}</p>
            <table className="mt-2 w-full text-[12px]">
              <tbody>
                <tr>
                  <td className="pr-4 text-neutral-600">
                    {isOrder ? "Orderdatum" : "Offertdatum"}
                  </td>
                  <td className="text-right">
                    {formatDate(
                      isOrder ? (quote.orderDate ?? quote.createdAt) : quote.createdAt
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="pr-4 text-neutral-600">
                    {isOrder ? "Ordernr" : "Offertnr"}
                  </td>
                  <td className="text-right">
                    {isOrder
                      ? (quote.orderNumber ?? quote.quoteNumber)
                      : quote.quoteNumber}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mottagare till vänster, dokumentuppgifter till höger */}
        <div className="mt-10 flex items-start justify-between gap-8">
          <div>
            <p className="font-semibold">{quote.customer.companyName}</p>
            {/* Faller tillbaka på kundens fritextfält för äldre offerter som
                saknar kopplad kontaktperson. */}
            {quote.contact ? (
              <p>{quote.contact.name}</p>
            ) : (
              quote.customer.contactPerson && (
                <p>{quote.customer.contactPerson}</p>
              )
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
          <table className="min-w-[240px] text-[12px]">
            <tbody>
              {meta.map((row) => (
                <tr key={row.label}>
                  <td className="pr-4 text-neutral-600">{row.label}</td>
                  <td className="text-right">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {quote.project && (
          <p className="mt-6 text-[12px] text-neutral-600">
            Projekt: {quote.project.name}
          </p>
        )}

        {/* Artikelrader */}
        <table className="mt-8 w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-neutral-400 text-left align-bottom">
              <th className="w-[64px] pb-1 pr-3 font-semibold">Artnr</th>
              <th className="pb-1 pr-3 font-semibold">Benämning</th>
              <th className="w-[64px] pb-1 pr-3 text-right font-semibold">
                Antal
              </th>
              {isOrder && (
                <th className="w-[64px] pb-1 pr-3 text-right font-semibold">
                  Lev ant
                </th>
              )}
              <th className="w-[52px] pb-1 pr-3 font-semibold">Enhet</th>
              {hasDiscount && (
                <th className="w-[56px] pb-1 pr-3 text-right font-semibold">
                  Rabatt
                </th>
              )}
              <th className="w-[88px] pb-1 pr-3 text-right font-semibold">
                À-pris
              </th>
              <th className="w-[96px] pb-1 text-right font-semibold">Summa</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="py-1.5 pr-3">{item.articleNumber ?? ""}</td>
                <td className="py-1.5 pr-3">{item.description}</td>
                <td className="py-1.5 pr-3 text-right">
                  {formatAmount(Number(item.quantity))}
                </td>
                {isOrder && (
                  <td className="py-1.5 pr-3 text-right">
                    {formatAmount(Number(item.quantity))}
                  </td>
                )}
                <td className="py-1.5 pr-3">
                  {item.unit === "m2" ? "m²" : item.unit}
                </td>
                {hasDiscount && (
                  <td className="py-1.5 pr-3 text-right">
                    {Number(item.discount) > 0
                      ? `${Number(item.discount)}%`
                      : ""}
                  </td>
                )}
                <td className="py-1.5 pr-3 text-right">
                  {formatAmount(Number(item.unitPrice))}
                </td>
                <td className="py-1.5 text-right">
                  {formatAmount(lineTotal(item))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summering som en rad, likt Fortnox */}
        <div className="mt-8 flex justify-end">
          <table className="text-[12px]">
            <thead>
              <tr className="border-b border-neutral-400 text-right">
                <th className="px-4 pb-1 font-semibold">Exkl. moms</th>
                <th className="px-4 pb-1 font-semibold">Moms</th>
                <th className="pl-4 pb-1 font-semibold">Totalt</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-right">
                <td className="px-4 pt-1.5">{formatAmount(sumExMoms)}</td>
                <td className="px-4 pt-1.5">{formatAmount(moms)}</td>
                <td className="pl-4 pt-1.5 font-semibold">
                  {formatAmount(totalIncMoms)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] text-neutral-600">
          Moms {defaultTerms.vatRate * 100}% {formatAmount(moms)} (
          {formatAmount(sumExMoms)})
        </p>

        {(quote.deliveryTerms || quote.notes) && (
          <div className="mt-8 space-y-3 text-[12px]">
            {quote.deliveryTerms && (
              <div>
                <p className="font-semibold">Leveransvillkor</p>
                <p className="whitespace-pre-wrap">{quote.deliveryTerms}</p>
              </div>
            )}
            {quote.notes && (
              <div>
                <p className="font-semibold">Övrigt</p>
                <p className="whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex gap-10 text-[11px]">
          <div>
            <span className="text-neutral-600">IBAN</span>{" "}
            <span>{company.iban}</span>
          </div>
          <div>
            <span className="text-neutral-600">BIC</span>{" "}
            <span>{company.bic}</span>
          </div>
        </div>

        {/* Sidfot med fullständiga företagsuppgifter */}
        <div className="mt-6 grid grid-cols-2 gap-6 border-t border-neutral-300 pt-4 text-[10px] leading-relaxed sm:grid-cols-4">
          <div>
            <p className="font-semibold text-neutral-600">Adress</p>
            <p>{company.legalName}</p>
            <p>{company.address}</p>
            <p>{company.zipCity}</p>
            <p>{company.country}</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-600">Telefon</p>
            <p>{company.phone}</p>
            <p className="mt-2 font-semibold text-neutral-600">E-post</p>
            <p>{company.email}</p>
            <p className="mt-2 font-semibold text-neutral-600">Webbadress</p>
            <p>{company.website}</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-600">Bankgiro</p>
            <p>{company.bankgiro}</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-600">Organisationsnr</p>
            <p>{company.orgNumber}</p>
            <p className="mt-2 font-semibold text-neutral-600">Momsreg. nr</p>
            <p>{company.vatNumber}</p>
            <p className="mt-2">{company.fSkatt}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
