"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LineItem {
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
}

export function LineItemsEditor() {
  const [lines, setLines] = useState<LineItem[]>([]);

  function addLine() {
    setLines([...lines, { description: "", unit: "st", quantity: "", unitPrice: "" }]);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof LineItem, value: string) {
    setLines(lines.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  const totalLines = lines.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0;
    const price = parseFloat(l.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Fria rader</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Lägg till rad
        </Button>
      </div>

      {lines.length > 0 && (
        <div className="space-y-2">
          <div className="hidden sm:grid sm:grid-cols-[1fr_80px_100px_120px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Beskrivning</span>
            <span>Enhet</span>
            <span>Antal</span>
            <span>À-pris</span>
            <span />
          </div>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_120px_36px] gap-2 items-start rounded-md border p-2 sm:border-0 sm:p-0">
              <input type="hidden" name={`lines[${i}].description`} value={line.description} />
              <input type="hidden" name={`lines[${i}].unit`} value={line.unit} />
              <input type="hidden" name={`lines[${i}].quantity`} value={line.quantity} />
              <input type="hidden" name={`lines[${i}].unitPrice`} value={line.unitPrice} />
              <Input
                placeholder="Beskrivning"
                value={line.description}
                onChange={(e) => updateLine(i, "description", e.target.value)}
              />
              <select
                value={line.unit}
                onChange={(e) => updateLine(i, "unit", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              >
                <option value="st">st</option>
                <option value="tim">tim</option>
                <option value="m2">m²</option>
                <option value="km">km</option>
                <option value="paket">paket</option>
              </select>
              <Input
                type="number"
                step="0.01"
                placeholder="Antal"
                value={line.quantity}
                onChange={(e) => updateLine(i, "quantity", e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="À-pris"
                value={line.unitPrice}
                onChange={(e) => updateLine(i, "unitPrice", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLine(i)}
                className="h-10 w-10 p-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {totalLines > 0 && (
            <p className="text-sm text-muted-foreground text-right pr-12">
              Summa fria rader: {totalLines.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
            </p>
          )}
        </div>
      )}

      {lines.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Lägg till rader för material, besök eller andra fasta kostnader utöver tidsposter.
        </p>
      )}

      <input type="hidden" name="lineCount" value={lines.length} />
    </div>
  );
}
