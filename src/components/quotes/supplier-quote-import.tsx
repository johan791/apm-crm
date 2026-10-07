"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  parseSupplierQuote,
  appendSupplierQuoteItems,
} from "@/lib/actions/supplier-quotes";
import { formatCurrency } from "@/lib/format";

interface Partner {
  id: string;
  companyName: string;
  defaultMarkup: number | null;
}

interface PreviewRow {
  rowId: string;
  description: string;
  unit: string;
  quantity: string;
  costPrice: string;
  supplierArticleNumber: string | null;
}

interface SupplierQuoteImportProps {
  quoteId: string;
  partners: Partner[];
}

const units = [
  { value: "st", label: "st" },
  { value: "tim", label: "tim" },
  { value: "m", label: "m" },
  { value: "m2", label: "m²" },
  { value: "paket", label: "paket" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function num(value: string) {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SupplierQuoteImport({
  quoteId,
  partners,
}: SupplierQuoteImportProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isParsing, startParsing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const [partnerId, setPartnerId] = useState("");
  const [quoteRef, setQuoteRef] = useState("");
  const [markup, setMarkup] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);

  const selectedPartner = partners.find((p) => p.id === partnerId);

  function handlePartnerChange(id: string) {
    setPartnerId(id);
    const partner = partners.find((p) => p.id === id);
    if (partner?.defaultMarkup !== null && partner?.defaultMarkup !== undefined) {
      setMarkup(String(partner.defaultMarkup));
    }
  }

  function handleParse() {
    const file = fileRef.current?.files?.[0];
    setError(null);
    setWarning(null);

    if (!file) {
      setError("Välj en PDF med leverantörens offert.");
      return;
    }
    if (!partnerId) {
      setError("Välj vilken leverantör offerten kommer från.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startParsing(async () => {
      const result = await parseSupplierQuote(formData);

      if (!result.ok) {
        setError(result.error);
        setRows(null);
        return;
      }

      setRows(
        result.lines.map((line) => ({
          rowId: generateId(),
          description: line.description,
          unit: line.unit,
          quantity: String(line.quantity),
          costPrice: String(Number(line.netUnitCost.toFixed(2))),
          supplierArticleNumber: line.supplierArticleNumber,
        }))
      );

      if (result.supplierQuoteNumber && !quoteRef) {
        setQuoteRef(result.supplierQuoteNumber);
      }

      if (result.check.mismatch && result.check.statedTotal !== null) {
        setWarning(
          `Radernas summa blir ${formatCurrency(
            result.check.calculatedTotal
          )} men leverantören anger ${formatCurrency(
            result.check.statedTotal
          )} exkl. moms. Kontrollera raderna innan du lägger till dem.`
        );
      }
    });
  }

  function updateRow(rowId: string, field: keyof PreviewRow, value: string) {
    setRows(
      (prev) =>
        prev?.map((row) =>
          row.rowId === rowId ? { ...row, [field]: value } : row
        ) ?? null
    );
  }

  function removeRow(rowId: string) {
    setRows((prev) => prev?.filter((row) => row.rowId !== rowId) ?? null);
  }

  function reset() {
    setRows(null);
    setError(null);
    setWarning(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const markupFactor = 1 + num(markup) / 100;
  const totalCost =
    rows?.reduce((sum, row) => sum + num(row.quantity) * num(row.costPrice), 0) ?? 0;
  const totalSales = totalCost * markupFactor;

  function handleAppend() {
    if (!rows || rows.length === 0) return;

    startSaving(async () => {
      await appendSupplierQuoteItems(quoteId, {
        partnerId,
        supplierQuoteRef: quoteRef,
        markupPercent: num(markup),
        items: rows.map((row) => ({
          description: row.description,
          unit: row.unit,
          quantity: num(row.quantity),
          costPrice: num(row.costPrice),
          unitPrice: Number((num(row.costPrice) * markupFactor).toFixed(2)),
          supplierArticleNumber: row.supplierArticleNumber,
        })),
      });
      reset();
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Läs in leverantörsoffert</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Leverantör</label>
            <select
              value={partnerId}
              onChange={(e) => handlePartnerChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Välj leverantör...</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.companyName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Leverantörens offertnr
            </label>
            <input
              type="text"
              value={quoteRef}
              onChange={(e) => setQuoteRef(e.target.value)}
              placeholder="Fylls i automatiskt"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Påslag %</label>
            <input
              type="text"
              inputMode="decimal"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">PDF</label>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="w-full text-sm file:mr-2 file:rounded-md file:border file:border-input file:bg-background file:px-2 file:py-1 file:text-sm"
            />
          </div>
        </div>

        {selectedPartner?.defaultMarkup !== null &&
          selectedPartner?.defaultMarkup !== undefined && (
            <p className="text-xs text-muted-foreground">
              Senast använda påslag för {selectedPartner.companyName}:{" "}
              {Number(selectedPartner.defaultMarkup)} %
            </p>
          )}

        <Button type="button" onClick={handleParse} disabled={isParsing}>
          <FileUp className="mr-2 h-4 w-4" />
          {isParsing ? "Läser offerten..." : "Läs in"}
        </Button>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
            {error}
          </p>
        )}

        {warning && (
          <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-700 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </p>
        )}

        {rows && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Kontrollera raderna innan de läggs till. Inget sparas förrän du
              klickar på knappen längst ner.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-2 font-medium min-w-[220px]">
                      Beskrivning
                    </th>
                    <th className="pb-2 pr-2 font-medium min-w-[80px]">Enhet</th>
                    <th className="pb-2 pr-2 font-medium text-right min-w-[70px]">
                      Antal
                    </th>
                    <th className="pb-2 pr-2 font-medium text-right min-w-[100px]">
                      Kostnad/st
                    </th>
                    <th className="pb-2 pr-2 font-medium text-right min-w-[100px]">
                      Kundpris/st
                    </th>
                    <th className="pb-2 pr-2 font-medium text-right min-w-[100px]">
                      Summa
                    </th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const cost = num(row.costPrice);
                    const sales = cost * markupFactor;
                    return (
                      <tr key={row.rowId} className="border-b last:border-0">
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) =>
                              updateRow(row.rowId, "description", e.target.value)
                            }
                            className={inputClass}
                          />
                          {row.supplierArticleNumber && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              Leverantörens artnr: {row.supplierArticleNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={row.unit}
                            onChange={(e) =>
                              updateRow(row.rowId, "unit", e.target.value)
                            }
                            className={inputClass}
                          >
                            {units.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={row.quantity}
                            onChange={(e) =>
                              updateRow(row.rowId, "quantity", e.target.value)
                            }
                            className={`${inputClass} text-right`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={row.costPrice}
                            onChange={(e) =>
                              updateRow(row.rowId, "costPrice", e.target.value)
                            }
                            className={`${inputClass} text-right`}
                          />
                        </td>
                        <td className="py-2 pr-2 text-right text-muted-foreground whitespace-nowrap">
                          {formatCurrency(sales)}
                        </td>
                        <td className="py-2 pr-2 text-right font-medium whitespace-nowrap">
                          {formatCurrency(num(row.quantity) * sales)}
                        </td>
                        <td className="py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeRow(row.rowId)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Er kostnad</span>
                  <span className="font-medium">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Kundpris ex. moms
                  </span>
                  <span className="font-medium">{formatCurrency(totalSales)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Påslag</span>
                  <span>{formatCurrency(totalSales - totalCost)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={reset}>
                Avbryt
              </Button>
              <Button type="button" onClick={handleAppend} disabled={isSaving}>
                {isSaving
                  ? "Lägger till..."
                  : `Lägg till ${rows.length} ${
                      rows.length === 1 ? "rad" : "rader"
                    } i offerten`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
