"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Partner } from "@/generated/prisma";

interface PartnerFormProps {
  action: (formData: FormData) => Promise<void>;
  partner?: Partner;
}

const categories = [
  { value: "logistics", label: "Logistik" },
  { value: "carpentry", label: "Snickeri" },
  { value: "upholstery", label: "Klädsel" },
  { value: "demolition", label: "Demontering" },
  { value: "refurbishment", label: "Renovering" },
  { value: "architect", label: "Arkitekt" },
  { value: "other", label: "Övrigt" },
];

export function PartnerForm({ action, partner }: PartnerFormProps) {
  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle>{partner ? "Redigera partner" : "Ny partner"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Företagsnamn *</Label>
              <Input
                id="companyName"
                name="companyName"
                required
                defaultValue={partner?.companyName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <select
                id="category"
                name="category"
                required
                defaultValue={partner?.category ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>
                  Välj kategori...
                </option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Kontaktperson</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                defaultValue={partner?.contactPerson ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={partner?.email ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={partner?.phone ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={partner?.notes ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">
              {partner ? "Spara ändringar" : "Skapa partner"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
