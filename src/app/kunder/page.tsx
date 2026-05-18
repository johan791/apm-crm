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

export default async function KunderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { companyName: { contains: q, mode: "insensitive" } },
            { contactPerson: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { companyName: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kunder</h1>
          <p className="text-muted-foreground">
            {customers.length} {customers.length === 1 ? "kund" : "kunder"}
          </p>
        </div>
        <Button render={<Link href="/kunder/ny" />}>
          <Plus className="mr-2 h-4 w-4" />
          Ny kund
        </Button>
      </div>

      <form className="flex max-w-sm gap-2">
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
