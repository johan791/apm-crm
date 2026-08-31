"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/current-user";

export async function createQuote(formData: FormData) {
  await requireAuth();
  const lastQuote = await prisma.quote.findFirst({
    orderBy: { quoteNumber: "desc" },
  });
  const quoteNumber = lastQuote ? lastQuote.quoteNumber + 1 : 1001;

  const validUntil = formData.get("validUntil") as string;
  const deliveryDate = formData.get("deliveryDate") as string;
  const projectId = formData.get("projectId") as string;

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId: formData.get("customerId") as string,
      contactId: (formData.get("contactId") as string) || null,
      projectId: projectId || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      deliveryTerms: (formData.get("deliveryTerms") as string) || null,
      paymentTerms: (formData.get("paymentTerms") as string) || null,
      ourReference: (formData.get("ourReference") as string) || null,
      yourReference: (formData.get("yourReference") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/offerter");
  revalidatePath("/");
  redirect(`/offerter/${quote.id}/redigera`);
}

export async function updateQuote(id: string, formData: FormData) {
  await requireAuth();
  const validUntil = formData.get("validUntil") as string;
  const deliveryDate = formData.get("deliveryDate") as string;
  const projectId = formData.get("projectId") as string;

  const newValidUntil = validUntil ? new Date(validUntil) : null;
  const existing = await prisma.quote.findUnique({
    where: { id },
    select: { validUntil: true },
  });
  // Först när giltighetstiden faktiskt flyttas ska en ny påminnelse kunna gå ut.
  const validUntilChanged =
    (existing?.validUntil?.getTime() ?? null) !==
    (newValidUntil?.getTime() ?? null);

  await prisma.quote.update({
    where: { id },
    data: {
      customerId: formData.get("customerId") as string,
      contactId: (formData.get("contactId") as string) || null,
      projectId: projectId || null,
      validUntil: newValidUntil,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      deliveryTerms: (formData.get("deliveryTerms") as string) || null,
      paymentTerms: (formData.get("paymentTerms") as string) || null,
      ourReference: (formData.get("ourReference") as string) || null,
      yourReference: (formData.get("yourReference") as string) || null,
      notes: (formData.get("notes") as string) || null,
      ...(validUntilChanged ? { expiryReminderSent: false } : {}),
    },
  });

  revalidatePath("/offerter");
  revalidatePath(`/offerter/${id}`);
  revalidatePath("/");
  redirect(`/offerter/${id}`);
}

export async function saveQuoteItems(quoteId: string, formData: FormData) {
  await requireAuth();
  const itemsJson = formData.get("items") as string;
  const items = JSON.parse(itemsJson) as Array<{
    articleNumber: string;
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
          articleNumber: item.articleNumber || null,
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
  await requireAuth();
  await prisma.quote.update({ where: { id }, data: { status } });
  revalidatePath(`/offerter/${id}`);
  revalidatePath("/offerter");
  revalidatePath("/");
}

/**
 * Gör offerten till en order. Ordern får ett eget löpnummer i en separat
 * serie (som i Fortnox, där offert 194 blir order 109) och offertnumret
 * finns kvar som referens på orderbekräftelsen.
 */
export async function convertToOrder(id: string) {
  await requireAuth();

  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  if (!quote) throw new Error("Offert hittades inte");

  // Redan konverterad – behåll ordernumret, sätt bara status.
  if (quote.orderNumber !== null) {
    await prisma.quote.update({ where: { id }, data: { status: "order" } });
  } else {
    const lastOrder = await prisma.quote.findFirst({
      where: { orderNumber: { not: null } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    await prisma.quote.update({
      where: { id },
      data: {
        status: "order",
        orderNumber: (lastOrder?.orderNumber ?? 1000) + 1,
        orderDate: new Date(),
      },
    });
  }

  revalidatePath(`/offerter/${id}`);
  revalidatePath(`/offerter/${id}/skriv-ut`);
  revalidatePath("/offerter");
  revalidatePath("/");
}

export async function createProjectFromQuote(id: string) {
  await requireAuth();
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!quote) throw new Error("Offert hittades inte");

  const project = await prisma.project.create({
    data: {
      name: `${quote.customer.companyName} – Offert #${quote.quoteNumber}`,
      description: `Projekt skapat från offert #${quote.quoteNumber}.${quote.notes ? `\n${quote.notes}` : ""}`,
      status: "active",
      customerId: quote.customerId,
    },
  });

  await prisma.quote.update({
    where: { id },
    data: { projectId: project.id },
  });
  await convertToOrder(id);

  revalidatePath(`/offerter/${id}`);
  revalidatePath("/offerter");
  revalidatePath("/projekt");
  revalidatePath("/");
  redirect(`/projekt/${project.id}`);
}

export async function deleteQuote(id: string) {
  await requireAuth();
  await prisma.quote.delete({ where: { id } });
  revalidatePath("/offerter");
  revalidatePath("/");
  redirect("/offerter");
}
