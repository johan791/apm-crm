"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/current-user";

export async function createInvoiceBasis(formData: FormData) {
  const userId = await currentUserId();
  const projectId = formData.get("projectId") as string;
  const notes = (formData.get("notes") as string) || null;
  const customerReference = (formData.get("customerReference") as string) || null;
  const ourReference = (formData.get("ourReference") as string) || null;
  const paymentTerms = (formData.get("paymentTerms") as string) || null;

  const fromStr = formData.get("periodFrom") as string;
  const toStr = formData.get("periodTo") as string;
  const periodFrom = new Date(fromStr + "T00:00:00.000Z");
  const periodTo = new Date(toStr + "T23:59:59.999Z");

  const lineCount = parseInt(formData.get("lineCount") as string) || 0;
  const lines: { description: string; unit: string; quantity: number; unitPrice: number; sortOrder: number }[] = [];
  for (let i = 0; i < lineCount; i++) {
    const desc = formData.get(`lines[${i}].description`) as string;
    const unit = (formData.get(`lines[${i}].unit`) as string) || "st";
    const qty = parseFloat(formData.get(`lines[${i}].quantity`) as string) || 0;
    const price = parseFloat(formData.get(`lines[${i}].unitPrice`) as string) || 0;
    if (desc && qty > 0) {
      lines.push({ description: desc, unit, quantity: qty, unitPrice: price, sortOrder: i });
    }
  }

  const entries = await prisma.timeEntry.findMany({
    where: {
      projectId,
      invoiced: false,
      date: { gte: periodFrom, lte: periodTo },
    },
    include: { project: true },
  });

  if (entries.length === 0 && lines.length === 0) {
    redirect("/fakturaunderlag/nytt?fel=inga-poster");
  }

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const hourlyRate = entries.length > 0 && entries[0].project.hourlyRate
    ? Number(entries[0].project.hourlyRate)
    : null;
  const timeAmount = hourlyRate ? totalHours * hourlyRate : 0;
  const linesAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const totalAmount = timeAmount + linesAmount || null;

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
      customerReference,
      ourReference,
      paymentTerms,
      createdById: userId,
      timeEntries: entries.length > 0
        ? { connect: entries.map((e) => ({ id: e.id })) }
        : undefined,
      lines: lines.length > 0
        ? { create: lines }
        : undefined,
    },
  });

  if (entries.length > 0) {
    await prisma.timeEntry.updateMany({
      where: { id: { in: entries.map((e) => e.id) } },
      data: { invoiced: true },
    });
  }

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
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!basis) throw new Error("Underlaget hittades inte.");

  const sep = ";";
  const csvLines: string[] = [
    ["Typ", "Datum", "Beskrivning", "Antal", "Enhet", "À-pris", "Summa", "Projekt", "Kund"].join(sep),
  ];

  const hourlyRate = basis.project.hourlyRate ? Number(basis.project.hourlyRate) : null;

  for (const entry of basis.timeEntries) {
    const hours = Number(entry.hours);
    const amount = hourlyRate ? hours * hourlyRate : 0;
    csvLines.push(
      [
        "Tid",
        entry.date.toISOString().slice(0, 10),
        `"${(entry.description ?? "").replace(/"/g, '""')}"`,
        hours.toFixed(2).replace(".", ","),
        "tim",
        hourlyRate ? hourlyRate.toFixed(2).replace(".", ",") : "",
        amount ? amount.toFixed(2).replace(".", ",") : "",
        `"${basis.project.name}"`,
        `"${basis.project.customer.companyName}"`,
      ].join(sep)
    );
  }

  for (const line of basis.lines) {
    const qty = Number(line.quantity);
    const price = Number(line.unitPrice);
    csvLines.push(
      [
        "Rad",
        "",
        `"${line.description.replace(/"/g, '""')}"`,
        qty.toFixed(2).replace(".", ","),
        line.unit,
        price.toFixed(2).replace(".", ","),
        (qty * price).toFixed(2).replace(".", ","),
        `"${basis.project.name}"`,
        `"${basis.project.customer.companyName}"`,
      ].join(sep)
    );
  }

  return csvLines.join("\n");
}
