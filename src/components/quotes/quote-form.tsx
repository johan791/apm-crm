"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer, Quote } from "@/generated/prisma";

interface QuoteFormProps {
  action: (formData: FormData) => Promise<void>;
  customers: Customer[];
  projects: Array<{ id: string; name: string }>;
  quote?: Quote;
  defaultCustomerId?: string;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

export function QuoteForm({
  action,
  customers,
  projects,
  quote,
  defaultCustomerId,
}: QuoteFormProps) {
  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle>
            {quote ? "Redigera offert" : "Ny offert"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Kund *</Label>
              <select
                id="customerId"
                name="customerId"
                required
                defaultValue={quote?.customerId ?? defaultCustomerId ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>
                  Välj kund...
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectId">Projekt</Label>
              <select
                id="projectId"
                name="projectId"
                defaultValue={quote?.projectId ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Inget projekt</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="validUntil">Giltig t.o.m.</Label>
              <Input
                id="validUntil"
                name="validUntil"
                type="date"
                defaultValue={formatDate(quote?.validUntil)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Betalningsvillkor</Label>
              <Input
                id="paymentTerms"
                name="paymentTerms"
                defaultValue={quote?.paymentTerms ?? "30 dagar netto"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryTerms">Leveransvillkor</Label>
            <textarea
              id="deliveryTerms"
              name="deliveryTerms"
              rows={2}
              defaultValue={quote?.deliveryTerms ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={quote?.notes ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">
              {quote ? "Spara ändringar" : "Skapa offert"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
