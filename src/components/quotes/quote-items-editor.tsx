"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveQuoteItems } from "@/lib/actions/quotes";
import { formatCurrency } from "@/lib/format";

interface QuoteItem {
  tempId: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
}

interface QuoteItemsEditorProps {
  quoteId: string;
  initialItems?: Array<{
    id: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    discount: number;
    sortOrder: number;
  }>;
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

function rowTotal(item: QuoteItem) {
  return item.quantity * item.unitPrice * (1 - item.discount / 100);
}

export function QuoteItemsEditor({
  quoteId,
  initialItems,
}: QuoteItemsEditorProps) {
  const [items, setItems] = useState<QuoteItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems.map((item) => ({
          tempId: generateId(),
          description: item.description,
          unit: item.unit,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          costPrice: Number(item.costPrice),
          discount: Number(item.discount),
        }))
      : [
          {
            tempId: generateId(),
            description: "",
            unit: "st",
            quantity: 1,
            unitPrice: 0,
            costPrice: 0,
            discount: 0,
          },
        ]
  );

  function updateItem(tempId: string, field: keyof QuoteItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      {
        tempId: generateId(),
        description: "",
        unit: "st",
        quantity: 1,
        unitPrice: 0,
        costPrice: 0,
        discount: 0,
      },
    ]);
  }

  function removeRow(tempId: string) {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  }

  const sumExMoms = items.reduce((sum, item) => sum + rowTotal(item), 0);
  const moms = sumExMoms * 0.25;
  const totalInkMoms = sumExMoms + moms;

  const totalCost = items.reduce(
    (sum, item) => sum + item.quantity * item.costPrice,
    0
  );
  const totalSales = sumExMoms;
  const marginKr = totalSales - totalCost;
  const marginPercent = totalSales > 0 ? (marginKr / totalSales) * 100 : 0;

  const itemsForSubmit = items.map((item, index) => ({
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    costPrice: item.costPrice,
    discount: item.discount,
    sortOrder: index,
  }));

  const actionWithId = saveQuoteItems.bind(null, quoteId);

  return (
    <div className="space-y-4">
      <form action={actionWithId}>
        <input type="hidden" name="items" value={JSON.stringify(itemsForSubmit)} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offertrader</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-2 font-medium min-w-[200px]">Beskrivning</th>
                    <th className="pb-2 pr-2 font-medium min-w-[80px]">Enhet</th>
                    <th className="pb-2 pr-2 font-medium text-right min-w-[70px]">Antal</th>
                    <th className="pb-2 pr-2 font-medium text-right min-w-[100px]">A-pris</th>
                    <th className="pb-2 pr-2 font-medium text-right min-w-[100px]">Kostnadspris</th>
                    <th className="pb-2 pr-2 font-medium text-right min-w-[70px]">Rabatt%</th>
                    <th className="pb-2 pr-2 font-medium text-right min-w-[100px]">Summa</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.tempId} className="border-b last:border-0">
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.tempId, "description", e.target.value)
                          }
                          placeholder="Beskrivning..."
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(item.tempId, "unit", e.target.value)
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                          type="number"
                          step="1"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.tempId,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              item.tempId,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.costPrice}
                          onChange={(e) =>
                            updateItem(
                              item.tempId,
                              "costPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) =>
                            updateItem(
                              item.tempId,
                              "discount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="py-2 pr-2 text-right font-medium whitespace-nowrap">
                        {formatCurrency(rowTotal(item))}
                      </td>
                      <td className="py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeRow(item.tempId)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="mt-3"
            >
              <Plus className="mr-2 h-4 w-4" />
              Lägg till rad
            </Button>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Summa ex. moms</span>
                  <span className="font-medium">{formatCurrency(sumExMoms)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moms 25%</span>
                  <span className="font-medium">{formatCurrency(moms)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 text-base font-semibold">
                  <span>Totalt inkl. moms</span>
                  <span>{formatCurrency(totalInkMoms)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-base">Intern marginalkalkyl</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Total kostnad</p>
                <p className="font-medium">{formatCurrency(totalCost)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total försäljning</p>
                <p className="font-medium">{formatCurrency(totalSales)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Marginal (kr)</p>
                <p className="font-medium">{formatCurrency(marginKr)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Marginal (%)</p>
                <p className="font-medium">{marginPercent.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button type="submit">Spara rader</Button>
        </div>
      </form>
    </div>
  );
}
