import Link from "next/link";
import { Users, FolderKanban, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [customerCount, projectCount, activeProjects, recentProjects] =
    await Promise.all([
      prisma.customer.count(),
      prisma.project.count(),
      prisma.project.count({ where: { status: "active" } }),
      prisma.project.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: { customer: true },
      }),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Välkommen till APM Projects projekthub
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kunder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-muted-foreground">registrerade kunder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projekt</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">totalt antal projekt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktiva</CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">pågående projekt</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button render={<Link href="/kunder/ny" />}>
          <Plus className="mr-2 h-4 w-4" />
          Ny kund
        </Button>
        <Button variant="outline" render={<Link href="/projekt/nytt" />}>
          <Plus className="mr-2 h-4 w-4" />
          Nytt projekt
        </Button>
      </div>

      {recentProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Senast uppdaterade projekt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projekt/${project.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.customer.companyName}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
