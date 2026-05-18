import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customers/customer-form";
import { updateCustomer } from "@/lib/actions/customers";
import { prisma } from "@/lib/prisma";

export default async function RedigeraKundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) notFound();

  const updateWithId = updateCustomer.bind(null, customer.id);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/kunder/${customer.id}`} />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka
      </Button>
      <CustomerForm action={updateWithId} customer={customer} />
    </div>
  );
}
