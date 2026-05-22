import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const categoryLabels: Record<string, string> = {
  logistics: "Logistik",
  carpentry: "Snickeri",
  upholstery: "Klädsel",
  demolition: "Demontering",
  refurbishment: "Renovering",
  architect: "Arkitekt",
  other: "Övrigt",
};

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { companyName: { contains: q, mode: "insensitive" } },
      { contactPerson: { contains: q, mode: "insensitive" } },
    ];
  }

  const partners = await prisma.partner.findMany({
    where,
    orderBy: { companyName: "asc" },
    include: { projects: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partners</h1>
          <p className="text-muted-foreground">
            {partners.length} {partners.length === 1 ? "partner" : "partners"}
          </p>
        </div>
        <Button render={<Link href="/partners/ny" />}>
          <Plus className="mr-2 h-4 w-4" />
          Ny partner
        </Button>
      </div>

      <form className="flex max-w-sm gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Sök partner..."
            defaultValue={q}
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">
          Sök
        </Button>
      </form>

      {partners.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {q ? "Inga partners matchade sökningen." : "Inga partners ännu."}
          </p>
          {!q && (
            <Button render={<Link href="/partners/ny" />} className="mt-4">
              Lägg till din första partner
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Företag</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Kontaktperson
                </TableHead>
                <TableHead className="hidden md:table-cell">Telefon</TableHead>
                <TableHead className="text-right">Projekt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <Link
                      href={`/partners/${partner.id}`}
                      className="font-medium hover:underline"
                    >
                      {partner.companyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {categoryLabels[partner.category] ?? partner.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {partner.contactPerson ?? "–"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {partner.phone ?? "–"}
                  </TableCell>
                  <TableCell className="text-right">
                    {partner.projects.length}
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
