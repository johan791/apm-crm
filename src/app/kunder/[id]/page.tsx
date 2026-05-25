import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Building, ExternalLink, FolderOpen, Link2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button";

const statusLabels: Record<string, string> = {
  active: "Aktivt",
  completed: "Avslutat",
  paused: "Pausat",
  cancelled: "Avbrutet",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  completed: "secondary",
  paused: "outline",
  cancelled: "destructive",
};

export default async function KundDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      responsibleUser: true,
      projects: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/kunder" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till kunder
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.companyName}</h1>
          {customer.orgNumber && (
            <p className="text-sm text-muted-foreground">
              Org.nr: {customer.orgNumber}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/kunder/${customer.id}/redigera`} />}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Redigera
          </Button>
          <DeleteCustomerButton id={customer.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontaktuppgifter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.contactPerson && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                {customer.contactPerson}
              </div>
            )}
            {customer.responsibleUser && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ansvarig:</span>
                {customer.responsibleUser.name}
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${customer.email}`}
                  className="hover:underline"
                >
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${customer.phone}`} className="hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}
            {(customer.address || customer.city) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {[customer.address, customer.zipCode, customer.city]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-4 w-4" />
              Dokument
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.onedriveFolderUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Kundmapp kopplad till OneDrive.
                </p>
                <Button
                  size="sm"
                  render={
                    <a
                      href={customer.onedriveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Öppna i OneDrive
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ingen OneDrive-mapp kopplad ännu. Koppla kundens dokumentmapp
                  för snabb åtkomst till ritningar, moodboards och fakturor.
                </p>
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Så här gör du:</p>
                  <p>1. Öppna kundens mapp i OneDrive</p>
                  <p>2. Högerklicka på mappen och välj &quot;Kopiera länk&quot;</p>
                  <p>3. Klicka &quot;Redigera&quot; ovan och klistra in länken i fältet &quot;OneDrive-mapp&quot;</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/kunder/${customer.id}/redigera`} />}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Koppla OneDrive-mapp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anteckningar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Projekt ({customer.projects.length})
          </h2>
          <Button
            size="sm"
            render={<Link href={`/projekt/nytt?kund=${customer.id}`} />}
          >
            Nytt projekt
          </Button>
        </div>

        {customer.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inga projekt för denna kund ännu.
          </p>
        ) : (
          <div className="space-y-2">
            {customer.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projekt/${project.id}`}
                className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
              >
                <span className="font-medium">{project.name}</span>
                <Badge variant={statusVariants[project.status] ?? "outline"}>
                  {statusLabels[project.status] ?? project.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
