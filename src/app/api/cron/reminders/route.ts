import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Escapa användarinmatning innan den interpoleras i mail-HTML, så att t.ex.
// ett projektnamn eller en aktivitetstitel inte kan injicera markup/länkar.
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(now.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowStart.getDate() + 1);

  const [deliveryEvents, activities] = await Promise.all([
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
  ]);

  if (deliveryEvents.length === 0 && activities.length === 0) {
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
    parts.push(
      `<h2>Leveranser imorgon (${dateStr})</h2><ul>${rows}</ul>`
    );
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
    parts.push(
      `<h2>Aktiviteter imorgon (${dateStr})</h2><ul>${rows}</ul>`
    );
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h1 style="color: #1a1a1a;">Påminnelse från APM CRM</h1>
      ${parts.join("")}
      <hr style="margin-top: 24px; border: none; border-top: 1px solid #e5e5e5;" />
      <p style="font-size: 12px; color: #888;">Detta mail skickades automatiskt från APM CRM.</p>
    </div>
  `;

  const subject = [
    deliveryEvents.length > 0
      ? `${deliveryEvents.length} leverans${deliveryEvents.length > 1 ? "er" : ""}`
      : "",
    activities.length > 0
      ? `${activities.length} aktivitet${activities.length > 1 ? "er" : ""}`
      : "",
  ]
    .filter(Boolean)
    .join(" och ");

  await sendReminderEmail(`Imorgon: ${subject}`, html);

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
  ]);

  return NextResponse.json({
    sent: true,
    deliveryEvents: deliveryEvents.length,
    activities: activities.length,
  });
}
