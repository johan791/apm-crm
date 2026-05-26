import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { createInvoiceBasis } from "@/lib/actions/invoice-basis";

export default async function NyttFakturaunderlagPage({
  searchParams,
}: {
  searchParams: Promise<{ fel?: string }>;
}) {
  const params = await searchParams;
  const projects = await prisma.project.findMany({
    where: {
      timeEntries: { some: { invoiced: false } },
    },
    orderBy: { name: "asc" },
    include: {
      customer: true,
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
                Inga ofakturerade tidsposter hittades i den valda perioden. Prova ett annat datumintervall.
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
                    {p.customer.companyName} — {p.name} ({p._count.timeEntries} ofakturerade poster)
                  </option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Inga projekt har ofakturerade tidsposter.
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
