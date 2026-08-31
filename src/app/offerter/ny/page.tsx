import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/quotes/quote-form";
import { createQuote } from "@/lib/actions/quotes";
import { prisma } from "@/lib/prisma";

export default async function NyOffertPage({
  searchParams,
}: {
  searchParams: Promise<{ kund?: string }>;
}) {
  const { kund } = await searchParams;

  const [customers, projects, contacts, users] = await Promise.all([
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.contact.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={kund ? `/kunder/${kund}` : "/offerter"} />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {kund ? "Tillbaka till kunden" : "Tillbaka till offerter"}
      </Button>
      <QuoteForm
        action={createQuote}
        customers={customers}
        projects={projects}
        defaultCustomerId={kund}
        contacts={contacts}
        users={users}
      />
    </div>
  );
}
