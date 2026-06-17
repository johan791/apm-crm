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
