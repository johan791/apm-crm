import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliveryEventForm } from "@/components/delivery/delivery-event-form";
import { DeleteDeliveryButton } from "@/components/delivery/delete-delivery-button";
import { CompleteDeliveryButton } from "@/components/delivery/complete-delivery-button";
import { updateDeliveryEvent } from "@/lib/actions/delivery-events";
import { prisma } from "@/lib/prisma";

export default async function RedigeraHändelsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [event, projects, customers] = await Promise.all([
    prisma.deliveryEvent.findUnique({
      where: { id },
      include: { completedBy: { select: { name: true } } },
    }),
    prisma.project.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, customer: { select: { id: true, companyName: true } } },
    }),
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
  ]);

  if (!event) notFound();

  const updateWithId = updateDeliveryEvent.bind(null, event.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/leveransplanering" />}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka till leveransplanering
        </Button>
        <DeleteDeliveryButton id={event.id} />
      </div>

      <CompleteDeliveryButton
        eventId={event.id}
        completedAt={event.completedAt}
        completedByName={event.completedBy?.name}
        completionNote={event.completionNote}
      />

      <DeliveryEventForm
        action={updateWithId}
        projects={projects}
        customers={customers}
        event={event}
      />
    </div>
  );
}
