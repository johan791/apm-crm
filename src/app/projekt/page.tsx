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
import { currentUserId } from "@/lib/current-user";

import { projectStatusLabels, projectStatusColors } from "@/lib/status-colors";

export default async function ProjektPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; visa?: string }>;
}) {
  const { q, status, visa } = await searchParams;
  const visaFilter = visa ?? "alla";
  const userId = await currentUserId();

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
  if (visaFilter === "mina") {
    where.responsibleUserId = userId;
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      customer: true,
      responsibleUser: true,
      quotes: { select: { id: true, status: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Projekt</h1>
          <p className="text-muted-foreground">
            {projects.length} projekt
          </p>
        </div>
        <Button render={<Link href="/projekt/nytt" />} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nytt projekt
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
                  href={`/projekt?visa=${opt.value}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}`}
                />
              }
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <form className="flex max-w-sm gap-2 flex-1">
          {status && <input type="hidden" name="status" value={status} />}
          {visaFilter !== "alla" && <input type="hidden" name="visa" value={visaFilter} />}
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
            render={<Link href={`/projekt?visa=${visaFilter}`} />}
          >
            Alla
          </Button>
          {Object.entries(projectStatusLabels).map(([value, label]) => (
            <Button
              key={value}
              variant={status === value ? "default" : "outline"}
              size="sm"
              render={
                <Link
                  href={`/projekt?visa=${visaFilter}&status=${value}${q ? `&q=${q}` : ""}`}
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
                <TableHead className="hidden md:table-cell">Ansvarig</TableHead>
                <TableHead className="hidden lg:table-cell text-right">
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
                        className={projectStatusColors[project.status] ?? ""}
                      >
                        {projectStatusLabels[project.status] ?? project.status}
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
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {project.responsibleUser?.name ?? "–"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right">
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
