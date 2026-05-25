import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProject } from "@/lib/actions/projects";
import { prisma } from "@/lib/prisma";

export default async function RedigeraProjektPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, customers, users] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  const updateWithId = updateProject.bind(null, project.id);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/projekt/${project.id}`} />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka
      </Button>
      <ProjectForm
        action={updateWithId}
        customers={customers}
        project={project}
        users={users}
      />
    </div>
  );
}
