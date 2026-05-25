import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { createQuickNote } from "@/lib/actions/activities";

const types = [
  { value: "anteckning", label: "Anteckning" },
  { value: "samtal", label: "Samtal" },
  { value: "mote", label: "Möte" },
  { value: "mejl", label: "Mejl" },
  { value: "uppgift", label: "Uppgift" },
  { value: "uppfoljning", label: "Uppföljning" },
];

export default async function NyAktivitetPage({
  searchParams,
}: {
  searchParams: Promise<{ kund?: string }>;
}) {
  const params = await searchParams;
  const customers = await prisma.customer.findMany({
    orderBy: { companyName: "asc" },
  });

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/aktiviteter" />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till aktiviteter
      </Button>

      <form action={createQuickNote}>
        <input type="hidden" name="returnTo" value="/aktiviteter" />
        <Card>
          <CardHeader>
            <CardTitle>Ny aktivitet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {types.map((t) => (
                <label key={t.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={t.value}
                    defaultChecked={t.value === "anteckning"}
                    className="peer sr-only"
                  />
                  <span className="inline-block rounded-full border px-3 py-1.5 text-sm font-medium transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary hover:bg-muted">
                    {t.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivning *</Label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                autoFocus
                placeholder="Beskriv vad som hände eller vad som ska göras..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerId">Kund</Label>
                <select
                  id="customerId"
                  name="customerId"
                  defaultValue={params.kund ?? ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Välj kund...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unlinkedCustomerText">
                  Eller skriv kundnamn
                </Label>
                <Input
                  id="unlinkedCustomerText"
                  name="unlinkedCustomerText"
                  placeholder="Om kunden inte finns i registret"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Titel (valfri)</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Kort rubrik"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Förfallodatum</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto" size="lg">
              Spara aktivitet
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
