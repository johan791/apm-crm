import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { DeletePartnerButton } from "@/components/partners/delete-partner-button";

const categoryLabels: Record<string, string> = {
  logistics: "Logistik",
  carpentry: "Snickeri",
  upholstery: "Klädsel",
  demolition: "Demontering",
  refurbishment: "Renovering",
  architect: "Arkitekt",
  other: "Övrigt",
};

const projectStatusLabels: Record<string, string> = {
  active: "Aktivt",
  completed: "Avslutat",
  paused: "Pausat",
  cancelled: "Avbrutet",
};

const projectStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  completed: "secondary",
  paused: "outline",
  cancelled: "destructive",
};

export default async function PartnerDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      projects: {
        include: {
          project: { include: { customer: true } },
        },
      },
    },
  });

  if (!partner) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/partners" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till partners
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{partner.companyName}</h1>
            <Badge variant="secondary">
              {categoryLabels[partner.category] ?? partner.category}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/partners/${partner.id}/redigera`} />}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Redigera
          </Button>
          <DeletePartnerButton id={partner.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontaktuppgifter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {partner.contactPerson && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                {partner.contactPerson}
              </div>
            )}
            {partner.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${partner.email}`}
                  className="hover:underline"
                >
                  {partner.email}
                </a>
              </div>
            )}
            {partner.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${partner.phone}`} className="hover:underline">
                  {partner.phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {partner.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anteckningar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{partner.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      <div>
        <h2 className="text-lg font-semibold mb-4">
          Projekt ({partner.projects.length})
        </h2>

        {partner.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inga projektkopplingar ännu.
          </p>
        ) : (
          <div className="space-y-2">
            {partner.projects.map((pp) => (
              <Link
                key={pp.id}
                href={`/projekt/${pp.project.id}`}
                className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
              >
                <div>
                  <span className="font-medium">{pp.project.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {pp.project.customer.companyName}
                  </span>
                  {pp.role && (
                    <span className="text-sm text-muted-foreground ml-2">
                      — {pp.role}
                    </span>
                  )}
                </div>
                <Badge
                  variant={
                    projectStatusVariants[pp.project.status] ?? "outline"
                  }
                >
                  {projectStatusLabels[pp.project.status] ?? pp.project.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
