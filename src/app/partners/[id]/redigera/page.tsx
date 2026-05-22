import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerForm } from "@/components/partners/partner-form";
import { updatePartner } from "@/lib/actions/partners";
import { prisma } from "@/lib/prisma";

export default async function RedigeraPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id } });

  if (!partner) notFound();

  const updateWithId = updatePartner.bind(null, partner.id);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/partners/${partner.id}`} />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka
      </Button>
      <PartnerForm action={updateWithId} partner={partner} />
    </div>
  );
}
