import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeEntryForm } from "@/components/time-entries/time-entry-form";
import { createTimeEntry } from "@/lib/actions/time-entries";
import { prisma } from "@/lib/prisma";

export default async function NyTidspostPage() {
  const projects = await prisma.project.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, customer: { select: { companyName: true } } },
  });

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/tidrapportering" />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till tidrapportering
      </Button>
      <TimeEntryForm action={createTimeEntry} projects={projects} />
    </div>
  );
}
