import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliveryEventForm } from "@/components/delivery/delivery-event-form";
import { createDeliveryEvent } from "@/lib/actions/delivery-events";
import { prisma } from "@/lib/prisma";

export default async function NyHändelsePage() {
  const [projects, customers] = await Promise.all([
    prisma.project.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, customer: { select: { id: true, companyName: true } } },
    }),
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/leveransplanering" />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till leveransplanering
      </Button>
      <DeliveryEventForm
        action={createDeliveryEvent}
        projects={projects}
        customers={customers}
      />
    </div>
  );
}
