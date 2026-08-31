import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_ADDRESS = process.env.MAIL_FROM ?? "APM CRM <noreply@apmproject.se>";
const NOTIFICATION_TO = process.env.MAIL_NOTIFICATION_TO ?? "info@apmproject.se";

export async function sendReminderEmail(subject: string, html: string) {
  return getResend().emails.send({
    from: FROM_ADDRESS,
    to: NOTIFICATION_TO,
    subject,
    html,
  });
}

/** Escapar användarinmatning innan den interpoleras i mail-HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Gemensam ram runt alla notismail från CRM:et. */
export function mailLayout(heading: string, body: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h1 style="color: #1a1a1a;">${escapeHtml(heading)}</h1>
      ${body}
      <hr style="margin-top: 24px; border: none; border-top: 1px solid #e5e5e5;" />
      <p style="font-size: 12px; color: #888;">Detta mail skickades automatiskt från APM CRM.</p>
    </div>
  `;
}
