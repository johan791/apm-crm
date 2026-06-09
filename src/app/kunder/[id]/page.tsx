import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Building, ExternalLink, FolderOpen, Link2, User, FileText, Users, Activity, MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button";
import { ContactList } from "@/components/customers/contact-list";
import { ActivityList } from "@/components/activities/activity-list";
import { QuickActivityForm } from "@/components/activities/quick-activity-form";
import { EmailLogList } from "@/components/email-logs/email-log-list";
import { QuickEmailForm } from "@/components/email-logs/quick-email-form";

import { projectStatusLabels, projectStatusColors, quoteStatusLabels, quoteStatusColors } from "@/lib/status-colors";

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
      contacts: { orderBy: { name: "asc" } },
      activities: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
        include: { createdBy: true, assignedTo: true },
      },
      emailLogs: {
        orderBy: { sentAt: "desc" },
        include: { createdBy: true },
      },
      projects: { orderBy: { updatedAt: "desc" } },
      quotes: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
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
          <h1>{customer.companyName}</h1>
          <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            {customer.orgNumber && <span>Org.nr: {customer.orgNumber}</span>}
            {customer.customerNumber && <span>Kundnr: {customer.customerNumber}</span>}
          </div>
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
            <CardTitle className="text-base">Uppgifter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Kontaktpersoner ({customer.contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ContactList
            customerId={customer.id}
            contacts={customer.contacts}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Aktiviteter ({customer.activities.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ActivityList activities={customer.activities} />
          <QuickActivityForm customerId={customer.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MailIcon className="h-4 w-4" />
            Mail ({customer.emailLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EmailLogList emails={customer.emailLogs} />
          <QuickEmailForm customerId={customer.id} />
        </CardContent>
      </Card>

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
                <Badge className={projectStatusColors[project.status] ?? ""}>
                  {projectStatusLabels[project.status] ?? project.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            <FileText className="inline h-4 w-4 mr-2" />
            Offerter ({customer.quotes.length})
          </h2>
          <Button
            size="sm"
            render={<Link href={`/offerter/ny?kund=${customer.id}`} />}
          >
            Ny offert
          </Button>
        </div>

        {customer.quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inga offerter för denna kund ännu.
          </p>
        ) : (
          <div className="space-y-2">
            {customer.quotes.map((quote) => {
              const total = quote.items.reduce((sum, item) => {
                const line = Number(item.quantity) * Number(item.unitPrice);
                const discounted = line * (1 - Number(item.discount) / 100);
                return sum + discounted;
              }, 0);

              return (
                <Link
                  key={quote.id}
                  href={`/offerter/${quote.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      Offert #{quote.quoteNumber}
                    </span>
                    <Badge className={quoteStatusColors[quote.status] ?? ""}>
                      {quoteStatusLabels[quote.status] ?? quote.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(total)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
