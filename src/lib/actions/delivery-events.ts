"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth, requireUserId } from "@/lib/current-user";
import { escapeHtml, mailLayout, sendReminderEmail } from "@/lib/mail";
import { formatDate } from "@/lib/format";

const eventTypeLabels: Record<string, string> = {
  delivery: "Leverans",
  installation: "Installation",
  pickup: "Upphämtning",
};

export async function createDeliveryEvent(formData: FormData) {
  await requireAuth();
  await prisma.deliveryEvent.create({
    data: {
      type: formData.get("type") as string,
      date: new Date(formData.get("date") as string),
      time: (formData.get("time") as string) || null,
      projectId: formData.get("projectId") as string,
      customerId: formData.get("customerId") as string,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/leveransplanering");
  revalidatePath("/");
  redirect("/leveransplanering");
}

export async function updateDeliveryEvent(id: string, formData: FormData) {
  await requireAuth();
  const date = new Date(formData.get("date") as string);
  const existing = await prisma.deliveryEvent.findUnique({
    where: { id },
    select: { date: true },
  });
  // Flyttas händelsen ska påminnelse och uppföljning gå ut på det nya datumet.
  const dateChanged =
    existing !== null && existing.date.getTime() !== date.getTime();

  await prisma.deliveryEvent.update({
    where: { id },
    data: {
      type: formData.get("type") as string,
      date,
      ...(dateChanged ? { reminderSent: false, followUpSent: false } : {}),
      time: (formData.get("time") as string) || null,
      projectId: formData.get("projectId") as string,
      customerId: formData.get("customerId") as string,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/leveransplanering");
  revalidatePath("/");
  redirect("/leveransplanering");
}

/**
 * Markerar en händelse som genomförd och skickar bekräftelse till APM.
 * Bekräftelsen är kvittot på att leveransen faktiskt blev av — utan den
 * finns bara den planerade tiden, aldrig utfallet.
 */
export async function completeDeliveryEvent(id: string, formData: FormData) {
  const userId = await requireUserId();

  const event = await prisma.deliveryEvent.update({
    where: { id },
    data: {
      completedAt: new Date(),
      completedById: userId,
      completionNote: (formData.get("completionNote") as string) || null,
      // Uppföljningen är avklarad i och med detta.
      followUpSent: true,
    },
    include: {
      project: { select: { name: true } },
      customer: { select: { companyName: true } },
      completedBy: { select: { name: true } },
    },
  });

  const typeLabel = eventTypeLabels[event.type] ?? event.type;
  const rows = [
    ["Projekt", event.project.name],
    ["Kund", event.customer.companyName],
    ["Planerat datum", formatDate(event.date)],
    ["Genomförd", formatDate(event.completedAt)],
    ["Bekräftad av", event.completedBy?.name ?? "–"],
    ...(event.address ? [["Adress", event.address]] : []),
    ...(event.completionNote ? [["Kommentar", event.completionNote]] : []),
  ];

  const body = `<table style="border-collapse: collapse; font-size: 14px;">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding: 4px 16px 4px 0; color: #666;">${escapeHtml(
          label
        )}</td><td style="padding: 4px 0;">${escapeHtml(value)}</td></tr>`
    )
    .join("")}</table>`;

  try {
    await sendReminderEmail(
      `${typeLabel} genomförd: ${event.project.name}`,
      mailLayout(`${typeLabel} genomförd`, body)
    );
  } catch (error) {
    // Mailet är en notis, inte en förutsättning — markeringen ska stå kvar
    // även om Resend är nere.
    console.error("Kunde inte skicka leveransbekräftelse", error);
  }

  revalidatePath("/leveransplanering");
  revalidatePath(`/leveransplanering/${id}/redigera`);
  revalidatePath("/");
}

/** Ångrar en felaktig markering. */
export async function reopenDeliveryEvent(id: string) {
  await requireAuth();
  await prisma.deliveryEvent.update({
    where: { id },
    data: {
      completedAt: null,
      completedById: null,
      completionNote: null,
      followUpSent: false,
    },
  });

  revalidatePath("/leveransplanering");
  revalidatePath(`/leveransplanering/${id}/redigera`);
  revalidatePath("/");
}

export async function deleteDeliveryEvent(id: string) {
  await requireAuth();
  await prisma.deliveryEvent.delete({ where: { id } });
  revalidatePath("/leveransplanering");
  revalidatePath("/");
  redirect("/leveransplanering");
}
