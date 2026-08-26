import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { escapeHtml, mailLayout, sendReminderEmail } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowStart.getDate() + 1);

  const [deliveryEvents, activities, expiringQuotes, unconfirmedDeliveries] =
    await Promise.all([
      prisma.deliveryEvent.findMany({
        where: {
          date: { gte: tomorrowStart, lt: tomorrowEnd },
          reminderSent: false,
        },
        include: {
          project: { select: { name: true } },
          customer: { select: { companyName: true } },
        },
      }),
      prisma.activity.findMany({
        where: {
          dueDate: { gte: tomorrowStart, lt: tomorrowEnd },
          reminderSent: false,
          status: "oppen",
          createdAt: { lt: tomorrowStart },
        },
        include: {
          customer: { select: { companyName: true } },
          project: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
      }),
      // Offerter som går ut imorgon — påminnelsen ska hinna före utgången
      // så att kunden kan följas upp medan offerten fortfarande gäller.
      prisma.quote.findMany({
        where: {
          validUntil: { gte: tomorrowStart, lt: tomorrowEnd },
          expiryReminderSent: false,
          status: { in: ["draft", "sent", "accepted"] },
        },
        include: {
          customer: { select: { companyName: true } },
          items: { select: { quantity: true, unitPrice: true, discount: true } },
        },
      }),
      // Passerade leveranser som ingen bekräftat. Frågan tittar bakåt utan
      // bortre gräns så att en missad körning inte tappar en händelse;
      // followUpSent gör att var och en bara påminns om en gång.
      prisma.deliveryEvent.findMany({
        where: {
          date: { lt: todayStart },
          completedAt: null,
          followUpSent: false,
        },
        include: {
          project: { select: { name: true } },
          customer: { select: { companyName: true } },
        },
      }),
    ]);

  if (
    deliveryEvents.length === 0 &&
    activities.length === 0 &&
    expiringQuotes.length === 0 &&
    unconfirmedDeliveries.length === 0
  ) {
    return NextResponse.json({ message: "Inga påminnelser att skicka" });
  }

  const dateStr = tomorrowStart.toLocaleDateString("sv-SE");
  const parts: string[] = [];

  if (deliveryEvents.length > 0) {
    const rows = deliveryEvents
      .map((e) => {
        const time = e.time ? ` kl ${escapeHtml(e.time)}` : "";
        const addr = e.address ? ` — ${escapeHtml(e.address)}` : "";
        return `<li><strong>${escapeHtml(e.project.name)}</strong> (${escapeHtml(e.customer.companyName)})${time}${addr}</li>`;
      })
      .join("");
    parts.push(`<h2>Leveranser imorgon (${dateStr})</h2><ul>${rows}</ul>`);
  }

  if (activities.length > 0) {
    const rows = activities
      .map((a) => {
        const who = a.assignedTo?.name ? ` — ${escapeHtml(a.assignedTo.name)}` : "";
        const ctx = a.customer?.companyName ?? a.project?.name ?? "";
        const ctxStr = ctx ? ` (${escapeHtml(ctx)})` : "";
        const label = a.title ?? a.description.slice(0, 80);
        return `<li><strong>${escapeHtml(label)}</strong>${ctxStr}${who}</li>`;
      })
      .join("");
    parts.push(`<h2>Aktiviteter imorgon (${dateStr})</h2><ul>${rows}</ul>`);
  }

  if (expiringQuotes.length > 0) {
    const rows = expiringQuotes
      .map((q) => {
        const value = q.items.reduce(
          (sum, item) =>
            sum +
            Number(item.quantity) *
              Number(item.unitPrice) *
              (1 - Number(item.discount) / 100),
          0
        );
        const valueStr = value.toLocaleString("sv-SE", {
          maximumFractionDigits: 0,
        });
        return `<li>Offert <strong>#${q.quoteNumber}</strong> — ${escapeHtml(q.customer.companyName)} (${valueStr} kr)</li>`;
      })
      .join("");
    parts.push(
      `<h2>Offerter som går ut ${dateStr}</h2><ul>${rows}</ul><p>Dags att följa upp kunden.</p>`
    );
  }

  if (unconfirmedDeliveries.length > 0) {
    const rows = unconfirmedDeliveries
      .map((e) => {
        const dateLabel = e.date.toLocaleDateString("sv-SE");
        return `<li><strong>${escapeHtml(e.project.name)}</strong> (${escapeHtml(e.customer.companyName)}) — planerad ${dateLabel}</li>`;
      })
      .join("");
    parts.push(
      `<h2>Bekräfta genomförd leverans</h2><ul>${rows}</ul><p>Markera händelsen som genomförd i leveransplaneringen.</p>`
    );
  }

  const html = mailLayout("Påminnelse från APM CRM", parts.join(""));

  const subject = [
    deliveryEvents.length > 0
      ? `${deliveryEvents.length} leverans${deliveryEvents.length > 1 ? "er" : ""} imorgon`
      : "",
    activities.length > 0
      ? `${activities.length} aktivitet${activities.length > 1 ? "er" : ""} imorgon`
      : "",
    expiringQuotes.length > 0
      ? `${expiringQuotes.length} offert${expiringQuotes.length > 1 ? "er" : ""} går ut`
      : "",
    unconfirmedDeliveries.length > 0
      ? `${unconfirmedDeliveries.length} leverans${unconfirmedDeliveries.length > 1 ? "er" : ""} att bekräfta`
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  await sendReminderEmail(`APM CRM: ${subject}`, html);

  await Promise.all([
    deliveryEvents.length > 0
      ? prisma.deliveryEvent.updateMany({
          where: { id: { in: deliveryEvents.map((e) => e.id) } },
          data: { reminderSent: true },
        })
      : null,
    activities.length > 0
      ? prisma.activity.updateMany({
          where: { id: { in: activities.map((a) => a.id) } },
          data: { reminderSent: true },
        })
      : null,
    expiringQuotes.length > 0
      ? prisma.quote.updateMany({
          where: { id: { in: expiringQuotes.map((q) => q.id) } },
          data: { expiryReminderSent: true },
        })
      : null,
    unconfirmedDeliveries.length > 0
      ? prisma.deliveryEvent.updateMany({
          where: { id: { in: unconfirmedDeliveries.map((e) => e.id) } },
          data: { followUpSent: true },
        })
      : null,
  ]);

  return NextResponse.json({
    sent: true,
    deliveryEvents: deliveryEvents.length,
    activities: activities.length,
    expiringQuotes: expiringQuotes.length,
    unconfirmedDeliveries: unconfirmedDeliveries.length,
  });
}
