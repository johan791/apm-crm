import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { createInvoiceBasis } from "@/lib/actions/invoice-basis";
import { LineItemsEditor } from "@/components/invoice-basis/line-items-editor";

export default async function NyttFakturaunderlagPage({
  searchParams,
}: {
  searchParams: Promise<{ fel?: string }>;
}) {
  const params = await searchParams;
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { timeEntries: { some: { invoiced: false } } },
        { status: "active" },
      ],
    },
    orderBy: { name: "asc" },
    include: {
      customer: true,
      responsibleUser: true,
      _count: {
        select: {
          timeEntries: { where: { invoiced: false } },
        },
      },
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/fakturaunderlag" />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka
      </Button>

      <form action={createInvoiceBasis}>
        <Card>
          <CardHeader>
            <CardTitle>Nytt fakturaunderlag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {params.fel === "inga-poster" && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                Inga ofakturerade tidsposter hittades i den valda perioden och inga fria rader angavs. Lägg till tidsposter eller fria rader.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="projectId">Projekt *</Label>
              <select
                id="projectId"
                name="projectId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Välj projekt...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.customer.companyName} — {p.name}
                    {p._count.timeEntries > 0
                      ? ` (${p._count.timeEntries} ofakturerade poster)`
                      : ""}
                  </option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Inga aktiva projekt hittades.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="periodFrom">Period från *</Label>
                <Input
                  id="periodFrom"
                  name="periodFrom"
                  type="date"
                  required
                  defaultValue={monthStartStr}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodTo">Period till *</Label>
                <Input
                  id="periodTo"
                  name="periodTo"
                  type="date"
                  required
                  defaultValue={today}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerReference">Er referens</Label>
                <Input
                  id="customerReference"
                  name="customerReference"
                  placeholder="Kontaktperson hos kund"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ourReference">Vår referens</Label>
                <Input
                  id="ourReference"
                  name="ourReference"
                  placeholder="Ansvarig hos APM"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Betalningsvillkor</Label>
                <select
                  id="paymentTerms"
                  name="paymentTerms"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Välj...</option>
                  <option value="10 dagar">10 dagar</option>
                  <option value="20 dagar">20 dagar</option>
                  <option value="30 dagar">30 dagar</option>
                  <option value="45 dagar">45 dagar</option>
                  <option value="60 dagar">60 dagar</option>
                </select>
              </div>
            </div>

            <Separator />

            <LineItemsEditor />

            <div className="space-y-2">
              <Label htmlFor="notes">Anteckningar</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Eventuella noteringar till underlaget..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto" size="lg">
              Skapa underlag
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
