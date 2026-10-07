import Anthropic from "@anthropic-ai/sdk";

/**
 * Läser en leverantörsoffert i PDF-form och plockar ut raderna.
 *
 * Leverantörerna använder helt olika mallar, så tolkningen görs av en
 * språkmodell i stället för en mall-parser. Filen skickas till Anthropic,
 * läses i minnet och sparas aldrig någonstans.
 */

const MODEL = "claude-opus-5";

// Samma enheter som offertradseditorn erbjuder.
const UNITS = ["st", "tim", "m", "m2", "paket"] as const;

export interface ParsedLine {
  /** Leverantörens benämning, ordagrant. Skrivs om av användaren vid behov. */
  description: string;
  quantity: number;
  unit: string;
  /** Leverantörens à-pris före deras eventuella rabatt. */
  unitPrice: number;
  /** Leverantörens rabatt i procent, 0 om ingen. */
  discountPercent: number;
  /** Leverantörens artikelnummer. Följer aldrig med ut på kundens offert. */
  supplierArticleNumber: string | null;
}

export interface ParsedSupplierQuote {
  lines: ParsedLine[];
  supplierName: string | null;
  supplierQuoteNumber: string | null;
  /** Totalsumman leverantören själv skrivit ut, för rimlighetskontroll. */
  statedTotalExVat: number | null;
}

export interface ImportCheck {
  /** Summan av de inlästa raderna, efter leverantörens rabatt. */
  calculatedTotal: number;
  statedTotal: number | null;
  /** Sant när raderna och leverantörens egen summa inte går ihop. */
  mismatch: boolean;
}

const SYSTEM_PROMPT = `Du läser offerter som svenska möbel- och inredningsleverantörer skickat till företaget APM Project.

Din uppgift är att plocka ut artikelraderna exakt som de står, så att de kan föras in i APM:s eget offertsystem.

Regler:
- Ta med varje rad som har ett antal och ett pris, även om priset eller antalet är noll (t.ex. "Parkeringsavgift 0,00" eller "Upp/nedmontering 0 h").
- Ta med rabattrader med negativt belopp som egna rader med negativt à-pris.
- Hoppa över fritext som inte är en artikelrad: inledande noteringar, villkorstexter, beskrivningar av bilder, texter om leveransvillkor och allt i sidhuvud och sidfot.
- Hör en beskrivning ihop över flera rader, slå ihop den till en enda beskrivning.
- Finns en rabattkolumn i procent, ange den i discountPercent och lämna unitPrice som priset före rabatt. Finns ingen rabatt, ange 0.
- Tal skrivs i olika format ("1 870,00", "2.350:-", "-1.171:-"). Returnera dem som vanliga tal, där decimaltecknet är punkt.
- Hitta aldrig på rader, priser eller artikelnummer. Saknas ett värde, utelämna det enligt schemat.
- statedTotalExVat ska vara den totalsumma exklusive moms som leverantören själv skrivit ut på offerten, inte din egen uträkning.`;

const TOOL_NAME = "registrera_offertrader";

const tool: Anthropic.Tool = {
  name: TOOL_NAME,
  description: "Registrerar artikelraderna från leverantörens offert.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      supplierName: {
        type: ["string", "null"],
        description: "Leverantörens företagsnamn som det står på offerten.",
      },
      supplierQuoteNumber: {
        type: ["string", "null"],
        description: "Leverantörens offertnummer.",
      },
      statedTotalExVat: {
        type: ["number", "null"],
        description: "Totalsumma exklusive moms som leverantören skrivit ut.",
      },
      lines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: "number" },
            unit: { type: "string", enum: [...UNITS] },
            unitPrice: { type: "number" },
            discountPercent: { type: "number" },
            supplierArticleNumber: { type: ["string", "null"] },
          },
          required: [
            "description",
            "quantity",
            "unit",
            "unitPrice",
            "discountPercent",
            "supplierArticleNumber",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["supplierName", "supplierQuoteNumber", "statedTotalExVat", "lines"],
    additionalProperties: false,
  },
};

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Modellen är instruerad att hålla sig till schemat, men svaret är ändå data
 * utifrån och valideras därefter innan något används.
 */
function normalize(raw: unknown): ParsedSupplierQuote {
  const input = (raw ?? {}) as Record<string, unknown>;
  const rawLines = Array.isArray(input.lines) ? input.lines : [];

  const lines: ParsedLine[] = rawLines
    .map((entry) => {
      const line = (entry ?? {}) as Record<string, unknown>;
      const description =
        typeof line.description === "string" ? line.description.trim() : "";
      const unit = typeof line.unit === "string" ? line.unit : "st";
      return {
        description,
        quantity: toFiniteNumber(line.quantity),
        unit: (UNITS as readonly string[]).includes(unit) ? unit : "st",
        unitPrice: toFiniteNumber(line.unitPrice),
        discountPercent: toFiniteNumber(line.discountPercent),
        supplierArticleNumber: toNullableString(line.supplierArticleNumber),
      };
    })
    .filter((line) => line.description.length > 0);

  return {
    lines,
    supplierName: toNullableString(input.supplierName),
    supplierQuoteNumber: toNullableString(input.supplierQuoteNumber),
    statedTotalExVat: toNullableNumber(input.statedTotalExVat),
  };
}

/** Nettokostnad per enhet, alltså leverantörens pris efter deras rabatt. */
export function netUnitCost(line: ParsedLine): number {
  return line.unitPrice * (1 - line.discountPercent / 100);
}

/**
 * Jämför radernas summa mot den summa leverantören själv skrivit ut.
 * En krona glapp tillåts för öresavrundning.
 */
export function checkTotal(parsed: ParsedSupplierQuote): ImportCheck {
  const calculatedTotal = parsed.lines.reduce(
    (sum, line) => sum + line.quantity * netUnitCost(line),
    0
  );
  const statedTotal = parsed.statedTotalExVat;
  return {
    calculatedTotal,
    statedTotal,
    mismatch: statedTotal !== null && Math.abs(calculatedTotal - statedTotal) > 1,
  };
}

export async function extractSupplierQuote(
  pdf: Uint8Array
): Promise<ParsedSupplierQuote> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY saknas. Lägg in nyckeln i miljövariablerna för att kunna läsa in leverantörsoffert."
    );
  }

  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    tools: [tool],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: Buffer.from(pdf).toString("base64"),
            },
          },
          {
            type: "text",
            text: "Plocka ut artikelraderna ur den här leverantörsofferten.",
          },
        ],
      },
    ],
  });

  // Förbrukningen loggas för att kostnaden per inläsning ska gå att följa upp.
  console.info(
    `[leverantörsoffert] tokens in ${response.usage.input_tokens}, ut ${response.usage.output_tokens}`
  );

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === TOOL_NAME
  );

  if (!toolUse) {
    throw new Error(
      "Kunde inte tolka offerten. Kontrollera att PDF:en innehåller en artikeltabell."
    );
  }

  return normalize(toolUse.input);
}
