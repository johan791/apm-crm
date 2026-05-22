"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer } from "@/generated/prisma";

interface CustomerFormProps {
  action: (formData: FormData) => Promise<void>;
  customer?: Customer;
}

export function CustomerForm({ action, customer }: CustomerFormProps) {
  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle>{customer ? "Redigera kund" : "Ny kund"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Företagsnamn *</Label>
              <Input
                id="companyName"
                name="companyName"
                required
                defaultValue={customer?.companyName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgNumber">Organisationsnummer</Label>
              <Input
                id="orgNumber"
                name="orgNumber"
                defaultValue={customer?.orgNumber ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Kontaktperson</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                defaultValue={customer?.contactPerson ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer?.email ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={customer?.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adress</Label>
              <Input
                id="address"
                name="address"
                defaultValue={customer?.address ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Postnummer</Label>
              <Input
                id="zipCode"
                name="zipCode"
                defaultValue={customer?.zipCode ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Stad</Label>
              <Input
                id="city"
                name="city"
                defaultValue={customer?.city ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onedriveFolderUrl">OneDrive-mapp</Label>
            <Input
              id="onedriveFolderUrl"
              name="onedriveFolderUrl"
              type="url"
              placeholder="https://onedrive.live.com/..."
              defaultValue={customer?.onedriveFolderUrl ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Högerklicka på kundens mapp i OneDrive → &quot;Kopiera länk&quot; → klistra in här.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={customer?.notes ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">
              {customer ? "Spara ändringar" : "Skapa kund"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
