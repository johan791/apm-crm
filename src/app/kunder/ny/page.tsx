import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomer } from "@/lib/actions/customers";
import { prisma } from "@/lib/prisma";

export default async function NyKundPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/kunder" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till kunder
      </Button>
      <CustomerForm action={createCustomer} users={users} />
    </div>
  );
}
