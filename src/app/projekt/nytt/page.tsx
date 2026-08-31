import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/projects/project-form";
import { createProject } from "@/lib/actions/projects";
import { prisma } from "@/lib/prisma";

export default async function NyttProjektPage({
  searchParams,
}: {
  searchParams: Promise<{ kund?: string }>;
}) {
  const { kund } = await searchParams;
  const [customers, users, contacts] = await Promise.all([
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.contact.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={kund ? `/kunder/${kund}` : "/projekt"} />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {kund ? "Tillbaka till kunden" : "Tillbaka till projekt"}
      </Button>
      <ProjectForm
        action={createProject}
        customers={customers}
        defaultCustomerId={kund}
        users={users}
        contacts={contacts}
      />
    </div>
  );
}
