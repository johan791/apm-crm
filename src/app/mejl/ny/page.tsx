import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { createEmailLog } from "@/lib/actions/email-logs";

export default async function NyMejlPage({
  searchParams,
}: {
  searchParams: Promise<{ kund?: string; projekt?: string }>;
}) {
  const params = await searchParams;
  const customers = await prisma.customer.findMany({
    orderBy: { companyName: "asc" },
  });
  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    include: { customer: true },
  });

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/mejl" />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till mejllogg
      </Button>

      <form action={createEmailLog}>
        <input type="hidden" name="returnTo" value="/mejl" />
        <Card>
          <CardHeader>
            <CardTitle>Logga mejl</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input type="radio" name="direction" value="ut" defaultChecked className="peer sr-only" />
                <span className="inline-block rounded-full border px-3 py-1.5 text-sm font-medium transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary hover:bg-muted">
                  Utgående
                </span>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="direction" value="in" className="peer sr-only" />
                <span className="inline-block rounded-full border px-3 py-1.5 text-sm font-medium transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary hover:bg-muted">
                  Inkommande
                </span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Ämne *</Label>
                <Input id="subject" name="subject" required placeholder="Ämnesrad" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="counterpart">Motpart *</Label>
                <Input id="counterpart" name="counterpart" required placeholder="E-postadress eller namn" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Innehåll</Label>
              <textarea
                id="body"
                name="body"
                rows={6}
                placeholder="Klistra in eller sammanfatta mejlet..."
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
                <Label htmlFor="projectId">Projekt</Label>
                <select
                  id="projectId"
                  name="projectId"
                  defaultValue={params.projekt ?? ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Välj projekt...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.customer.companyName} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sentAt">Datum</Label>
              <Input
                id="sentAt"
                name="sentAt"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto" size="lg">
              Spara mejl
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
