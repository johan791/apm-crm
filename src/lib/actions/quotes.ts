"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createQuote(formData: FormData) {
  const lastQuote = await prisma.quote.findFirst({
    orderBy: { quoteNumber: "desc" },
  });
  const quoteNumber = lastQuote ? lastQuote.quoteNumber + 1 : 1001;

  const validUntil = formData.get("validUntil") as string;
  const projectId = formData.get("projectId") as string;

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId: formData.get("customerId") as string,
      projectId: projectId || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      deliveryTerms: (formData.get("deliveryTerms") as string) || null,
      paymentTerms: (formData.get("paymentTerms") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/offerter");
  revalidatePath("/");
  redirect(`/offerter/${quote.id}/redigera`);
}

export async function updateQuote(id: string, formData: FormData) {
  const validUntil = formData.get("validUntil") as string;
  const projectId = formData.get("projectId") as string;

  await prisma.quote.update({
    where: { id },
    data: {
      customerId: formData.get("customerId") as string,
      projectId: projectId || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      deliveryTerms: (formData.get("deliveryTerms") as string) || null,
      paymentTerms: (formData.get("paymentTerms") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/offerter");
  revalidatePath(`/offerter/${id}`);
  revalidatePath("/");
  redirect(`/offerter/${id}`);
}

export async function saveQuoteItems(quoteId: string, formData: FormData) {
  const itemsJson = formData.get("items") as string;
  const items = JSON.parse(itemsJson) as Array<{
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    discount: number;
    sortOrder: number;
  }>;

  await prisma.$transaction([
    prisma.quoteItem.deleteMany({ where: { quoteId } }),
    ...items.map((item) =>
      prisma.quoteItem.create({
        data: {
          quoteId,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          discount: item.discount,
          sortOrder: item.sortOrder,
        },
      })
    ),
  ]);

  revalidatePath(`/offerter/${quoteId}`);
  revalidatePath(`/offerter/${quoteId}/redigera`);
  revalidatePath("/offerter");
  redirect(`/offerter/${quoteId}`);
}

export async function updateQuoteStatus(id: string, status: string) {
  await prisma.quote.update({ where: { id }, data: { status } });
  revalidatePath(`/offerter/${id}`);
  revalidatePath("/offerter");
  revalidatePath("/");
}

export async function convertToOrder(id: string) {
  await prisma.quote.update({ where: { id }, data: { status: "order" } });
  revalidatePath(`/offerter/${id}`);
  revalidatePath("/offerter");
  revalidatePath("/");
}

export async function deleteQuote(id: string) {
  await prisma.quote.delete({ where: { id } });
  revalidatePath("/offerter");
  revalidatePath("/");
  redirect("/offerter");
}
