import Link from "next/link";
import { Plus, Search, FileText } from "lucide-react";
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

const statusLabels: Record<string, string> = {
  active: "Aktivt",
  completed: "Avslutat",
  paused: "Pausat",
  cancelled: "Avbrutet",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  completed: "secondary",
  paused: "outline",
  cancelled: "destructive",
};

export default async function ProjektPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { customer: { companyName: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (status) {
    where.status = status;
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { customer: true, quotes: { select: { id: true, status: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projekt</h1>
          <p className="text-muted-foreground">
            {projects.length} projekt
          </p>
        </div>
        <Button render={<Link href="/projekt/nytt" />}>
          <Plus className="mr-2 h-4 w-4" />
          Nytt projekt
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form className="flex max-w-sm gap-2 flex-1">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Sök projekt..."
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
            render={<Link href="/projekt" />}
          >
            Alla
          </Button>
          {Object.entries(statusLabels).map(([value, label]) => (
            <Button
              key={value}
              variant={status === value ? "default" : "outline"}
              size="sm"
              render={
                <Link
                  href={`/projekt?status=${value}${q ? `&q=${q}` : ""}`}
                />
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {q || status
              ? "Inga projekt matchade filtret."
              : "Inga projekt ännu."}
          </p>
          {!q && !status && (
            <Button
              render={<Link href="/projekt/nytt" />}
              className="mt-4"
            >
              Skapa ditt första projekt
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projekt</TableHead>
                <TableHead className="hidden sm:table-cell">Kund</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell text-right">
                  Timpris
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={`/projekt/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Link
                      href={`/kunder/${project.customer.id}`}
                      className="hover:underline text-muted-foreground"
                    >
                      {project.customer.companyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={statusVariants[project.status] ?? "outline"}
                      >
                        {statusLabels[project.status] ?? project.status}
                      </Badge>
                      {project.quotes.length > 0 &&
                        !project.quotes.some((q) => q.status === "accepted") && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <FileText className="h-3 w-3" />
                            Offertfas
                          </Badge>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    {project.hourlyRate
                      ? `${project.hourlyRate} kr`
                      : "–"}
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
