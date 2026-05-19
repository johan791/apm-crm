import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/quotes/quote-form";
import { QuoteItemsEditor } from "@/components/quotes/quote-items-editor";
import { updateQuote } from "@/lib/actions/quotes";
import { prisma } from "@/lib/prisma";

export default async function RedigeraOffertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, customers, projects] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!quote) notFound();

  const updateWithId = updateQuote.bind(null, quote.id);

  const initialItems = quote.items.map((item) => ({
    id: item.id,
    description: item.description,
    unit: item.unit,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    costPrice: Number(item.costPrice),
    discount: Number(item.discount),
    sortOrder: item.sortOrder,
  }));

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/offerter/${quote.id}`} />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka
      </Button>

      <QuoteForm
        action={updateWithId}
        customers={customers}
        projects={projects}
        quote={quote}
      />

      <QuoteItemsEditor quoteId={quote.id} initialItems={initialItems} />
    </div>
  );
}
