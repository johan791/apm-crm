import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeEntryForm } from "@/components/time-entries/time-entry-form";
import { updateTimeEntry } from "@/lib/actions/time-entries";
import { prisma } from "@/lib/prisma";

export default async function RedigeraTidspostPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  const { id, entryId } = await params;
  const [timeEntry, projects] = await Promise.all([
    prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.project.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, customer: { select: { companyName: true } } },
    }),
  ]);

  if (!timeEntry) notFound();

  const updateWithId = updateTimeEntry.bind(null, timeEntry.id);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/projekt/${id}/tid`} />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka
      </Button>
      <TimeEntryForm
        action={updateWithId}
        projects={projects}
        timeEntry={timeEntry}
      />
    </div>
  );
}
