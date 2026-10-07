"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import {
  extractSupplierQuote,
  checkTotal,
  netUnitCost,
  type ImportCheck,
  type ParsedLine,
} from "@/lib/supplier-quote-import";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

export interface ImportPreviewLine extends ParsedLine {
  /** Leverantörens nettokostnad per enhet, efter deras rabatt. */
  netUnitCost: number;
}

export type ParseResult =
  | {
      ok: true;
      lines: ImportPreviewLine[];
      supplierName: string | null;
      supplierQuoteNumber: string | null;
      check: ImportCheck;
    }
  | { ok: false; error: string };

export async function parseSupplierQuote(
  formData: FormData
): Promise<ParseResult> {
  await requireAuth();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Ingen fil vald." };
  }
  if (file.type !== "application/pdf") {
    return { ok: false, error: "Filen måste vara en PDF." };
  }
  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, error: "Filen är större än 5 MB." };
  }

  try {
    const parsed = await extractSupplierQuote(
      new Uint8Array(await file.arrayBuffer())
    );

    if (parsed.lines.length === 0) {
      return {
        ok: false,
        error: "Hittade inga artikelrader i offerten. Kontrollera att rätt fil valdes.",
      };
    }

    return {
      ok: true,
      lines: parsed.lines.map((line) => ({
        ...line,
        netUnitCost: netUnitCost(line),
      })),
      supplierName: parsed.supplierName,
      supplierQuoteNumber: parsed.supplierQuoteNumber,
      check: checkTotal(parsed),
    };
  } catch (error) {
    console.error("Inläsning av leverantörsoffert misslyckades", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Något gick fel vid inläsningen av offerten.",
    };
  }
}

export interface ItemToAppend {
  description: string;
  unit: string;
  quantity: number;
  /** Nettokostnad per enhet, det APM betalar leverantören. */
  costPrice: number;
  /** Kundens pris per enhet, kostnad plus påslag. */
  unitPrice: number;
  supplierArticleNumber: string | null;
}

export async function appendSupplierQuoteItems(
  quoteId: string,
  input: {
    partnerId: string;
    supplierQuoteRef: string;
    markupPercent: number;
    items: ItemToAppend[];
  }
) {
  await requireAuth();

  if (input.items.length === 0) return;

  const lastItem = await prisma.quoteItem.findFirst({
    where: { quoteId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const offset = (lastItem?.sortOrder ?? -1) + 1;

  const quoteRef = input.supplierQuoteRef.trim() || null;

  await prisma.$transaction([
    // Raderna läggs till sist, befintliga rader rörs inte — en offert kan
    // bestå av underlag från flera leverantörer.
    ...input.items.map((item, index) =>
      prisma.quoteItem.create({
        data: {
          quoteId,
          // Leverantörens artikelnummer hör hemma i ursprunget, inte i
          // offertens eget artikelnummerfält som syns för kunden.
          articleNumber: null,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          // Leverantörens rabatt är redan invikt i kostnaden och ska aldrig
          // visas som rabatt mot kund.
          discount: 0,
          sortOrder: offset + index,
          sourcePartnerId: input.partnerId,
          sourceQuoteRef: quoteRef,
          sourceArticleNumber: item.supplierArticleNumber,
        },
      })
    ),
    prisma.partner.update({
      where: { id: input.partnerId },
      data: { defaultMarkup: input.markupPercent },
    }),
  ]);

  revalidatePath(`/offerter/${quoteId}`);
  revalidatePath(`/offerter/${quoteId}/redigera`);
  revalidatePath("/offerter");
}
