import Link from "next/link";
import { Plus, Search } from "lucide-react";
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
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/current-user";

export default async function KunderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; visa?: string }>;
}) {
  const { q, visa } = await searchParams;
  const visaFilter = visa ?? "alla";
  const userId = await currentUserId();

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { companyName: { contains: q, mode: "insensitive" } },
      { contactPerson: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }
  if (visaFilter === "mina") {
    where.responsibleUserId = userId;
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { companyName: "asc" },
    include: {
      responsibleUser: true,
      _count: { select: { projects: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Kunder</h1>
          <p className="text-muted-foreground">
            {customers.length} {customers.length === 1 ? "kund" : "kunder"}
          </p>
        </div>
        <Button render={<Link href="/kunder/ny" />} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ny kund
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {[
            { value: "mina", label: "Mina" },
            { value: "alla", label: "Alla" },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={visaFilter === opt.value ? "default" : "outline"}
              size="sm"
              render={
                <Link
                  href={`/kunder?visa=${opt.value}${q ? `&q=${q}` : ""}`}
                />
              }
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <form className="flex max-w-sm gap-2 flex-1">
          {visaFilter !== "alla" && <input type="hidden" name="visa" value={visaFilter} />}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Sök kunder..."
              defaultValue={q}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary">
            Sök
          </Button>
        </form>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {q ? "Inga kunder matchade sökningen." : "Inga kunder ännu."}
          </p>
          {!q && (
            <Button render={<Link href="/kunder/ny" />} className="mt-4">
              Skapa din första kund
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Företag</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Kontaktperson
                </TableHead>
                <TableHead className="hidden md:table-cell">Stad</TableHead>
                <TableHead className="hidden sm:table-cell">Ansvarig</TableHead>
                <TableHead className="text-right">Projekt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/kunder/${customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {customer.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {customer.contactPerson ?? "–"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {customer.city ?? "–"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {customer.responsibleUser?.name ?? "–"}
                  </TableCell>
                  <TableCell className="text-right">
                    {customer._count.projects}
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
