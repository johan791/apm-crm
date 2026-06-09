import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { EmailLogList } from "@/components/email-logs/email-log-list";

export default async function MejlPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { counterpart: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }

  const emails = await prisma.emailLog.findMany({
    where,
    orderBy: { sentAt: "desc" },
    include: {
      createdBy: true,
      customer: { select: { id: true, companyName: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Maillogg</h1>
          <p className="text-muted-foreground">
            {emails.length} {emails.length === 1 ? "mail" : "mail"} loggade
          </p>
        </div>
        <Button render={<Link href="/mejl/ny" />} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          Logga mail
        </Button>
      </div>

      <form className="flex max-w-sm gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Sök ämne, motpart eller innehåll..."
            defaultValue={q}
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">
          Sök
        </Button>
      </form>

      <div className="space-y-2">
        {emails.map((email) => (
          <EmailLogList
            key={email.id}
            emails={[email]}
            context={
              email.customer || email.project
                ? { customer: email.customer, project: email.project }
                : undefined
            }
          />
        ))}
        {emails.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">Inga mail loggade</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {q ? "Inga mail matchade sökningen." : "Börja logga mail för att se dem här."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
