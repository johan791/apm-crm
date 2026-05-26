"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/current-user";

export async function createInvoiceBasis(formData: FormData) {
  const userId = await currentUserId();
  const projectId = formData.get("projectId") as string;
  const notes = (formData.get("notes") as string) || null;

  const fromStr = formData.get("periodFrom") as string;
  const toStr = formData.get("periodTo") as string;
  const periodFrom = new Date(fromStr + "T00:00:00.000Z");
  const periodTo = new Date(toStr + "T23:59:59.999Z");

  const entries = await prisma.timeEntry.findMany({
    where: {
      projectId,
      invoiced: false,
      date: { gte: periodFrom, lte: periodTo },
    },
    include: { project: true },
  });

  if (entries.length === 0) {
    redirect("/fakturaunderlag/nytt?fel=inga-poster");
  }

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const hourlyRate = entries[0].project.hourlyRate
    ? Number(entries[0].project.hourlyRate)
    : null;
  const totalAmount = hourlyRate ? totalHours * hourlyRate : null;

  const lastBasis = await prisma.invoiceBasis.findFirst({
    orderBy: { number: "desc" },
  });
  const nextNumber = (lastBasis?.number ?? 0) + 1;

  const basis = await prisma.invoiceBasis.create({
    data: {
      number: nextNumber,
      projectId,
      periodFrom,
      periodTo,
      totalHours,
      totalAmount,
      notes,
      createdById: userId,
      timeEntries: {
        connect: entries.map((e) => ({ id: e.id })),
      },
    },
  });

  await prisma.timeEntry.updateMany({
    where: { id: { in: entries.map((e) => e.id) } },
    data: { invoiced: true },
  });

  revalidatePath("/fakturaunderlag");
  redirect(`/fakturaunderlag/${basis.id}`);
}

export async function reopenInvoiceBasis(id: string) {
  const basis = await prisma.invoiceBasis.findUnique({
    where: { id },
    include: { timeEntries: true },
  });

  if (!basis) throw new Error("Underlaget hittades inte.");

  await prisma.timeEntry.updateMany({
    where: { id: { in: basis.timeEntries.map((e) => e.id) } },
    data: { invoiced: false, invoiceBasisId: null },
  });

  await prisma.invoiceBasis.delete({ where: { id } });

  revalidatePath("/fakturaunderlag");
  redirect("/fakturaunderlag");
}

export async function exportInvoiceBasisCsv(id: string): Promise<string> {
  const basis = await prisma.invoiceBasis.findUnique({
    where: { id },
    include: {
      project: { include: { customer: true } },
      timeEntries: { orderBy: { date: "asc" } },
    },
  });

  if (!basis) throw new Error("Underlaget hittades inte.");

  const sep = ";";
  const lines: string[] = [
    ["Datum", "Timmar", "Beskrivning", "Projekt", "Kund"].join(sep),
  ];

  for (const entry of basis.timeEntries) {
    lines.push(
      [
        entry.date.toISOString().slice(0, 10),
        Number(entry.hours).toFixed(2).replace(".", ","),
        `"${(entry.description ?? "").replace(/"/g, '""')}"`,
        `"${basis.project.name}"`,
        `"${basis.project.customer.companyName}"`,
      ].join(sep)
    );
  }

  return lines.join("\n");
}
