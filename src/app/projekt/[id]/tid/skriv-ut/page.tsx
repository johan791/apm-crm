import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatHours } from "@/lib/format";
import { PrintButton } from "./print-button";
import { DateFilter } from "./date-filter";

export default async function TidrapportUtskriftPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { from, to } = await searchParams;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      responsibleUser: true,
    },
  });

  if (!project) notFound();

  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to + "T23:59:59");

  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      projectId: id,
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    },
    orderBy: { date: "asc" },
  });

  const totalHours = timeEntries.reduce(
    (sum, e) => sum + Number(e.hours),
    0
  );

  const totalAmount = project.hourlyRate
    ? totalHours * Number(project.hourlyRate)
    : null;

  const uniqueDays = new Set(
    timeEntries.map((e) => e.date.toISOString().slice(0, 10))
  ).size;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/projekt/${project.id}/tid`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
        <div className="flex items-center gap-3">
          <DateFilter from={from} to={to} projectId={project.id} />
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto max-w-[210mm] rounded-md border bg-white p-8 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Header with logo */}
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
            <p className="text-lg font-bold">Tidrapport</p>
            <p className="text-muted-foreground">
              {from && to
                ? `${from} — ${to}`
                : from
                  ? `Från ${from}`
                  : to
                    ? `Till ${to}`
                    : "Samtliga poster"}
            </p>
          </div>
        </div>

        <hr className="my-6" />

        {/* Customer & project info */}
        <div className="flex justify-between text-sm">
          <div>
            <p className="font-semibold">{project.customer.companyName}</p>
            {project.customer.contactPerson && (
              <p>{project.customer.contactPerson}</p>
            )}
            {project.customer.address && <p>{project.customer.address}</p>}
            {(project.customer.zipCode || project.customer.city) && (
              <p>
                {[project.customer.zipCode, project.customer.city]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p>
              <span className="text-muted-foreground">Projekt: </span>
              <span className="font-medium">{project.name}</span>
            </p>
            {project.responsibleUser && (
              <p>
                <span className="text-muted-foreground">Ansvarig: </span>
                {project.responsibleUser.name}
              </p>
            )}
            {project.hourlyRate && (
              <p>
                <span className="text-muted-foreground">Timpris: </span>
                {Number(project.hourlyRate)} kr
              </p>
            )}
          </div>
        </div>

        {/* Time entries table */}
        <div className="mt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold">Datum</th>
                <th className="pb-2 pr-4 font-semibold text-right">Timmar</th>
                <th className="pb-2 font-semibold">Beskrivning</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {formatDate(entry.date)}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {formatHours(entry.hours)}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {entry.description || "–"}
                  </td>
                </tr>
              ))}
              {timeEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Inga tidsposter för vald period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {timeEntries.length > 0 && (
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Antal poster</span>
                <span className="font-medium">{timeEntries.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Antal dagar</span>
                <span className="font-medium">{uniqueDays}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Totalt timmar</span>
                <span>{formatHours(totalHours)}</span>
              </div>
              {totalAmount !== null && (
                <div className="flex justify-between text-base font-bold">
                  <span>Totalt belopp</span>
                  <span>
                    {new Intl.NumberFormat("sv-SE", {
                      style: "currency",
                      currency: "SEK",
                      minimumFractionDigits: 0,
                    }).format(totalAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t pt-4 text-xs text-muted-foreground flex justify-between">
          <span>Arbetsplatsmiljö i Väst AB — APM Project</span>
          <span>
            Utskriven{" "}
            {new Date().toLocaleDateString("sv-SE")}
          </span>
        </div>
      </div>
    </div>
  );
}
