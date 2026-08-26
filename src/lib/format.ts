import type { Decimal } from "@/generated/prisma/runtime/library";

export function formatCurrency(amount: number | Decimal): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Belopp utan valutasymbol med två decimaler ("257 400,00"), som Fortnox
 * skriver ut på offerter och orderbekräftelser.
 */
export function formatAmount(amount: number | Decimal): string {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "–";
  return date.toLocaleDateString("sv-SE");
}

export function formatHours(hours: number | Decimal): string {
  return `${Number(hours).toFixed(1)} tim`;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const swedishMonths = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December",
];

export const swedishDaysShort = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
