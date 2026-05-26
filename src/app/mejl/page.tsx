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
      <div className="flex items-center justify-between">
        <div>
          <h1>Mejllogg</h1>
          <p className="text-muted-foreground">
            {emails.length} {emails.length === 1 ? "mejl" : "mejl"} loggade
          </p>
        </div>
        <Button render={<Link href="/mejl/ny" />}>
          <Plus className="mr-2 h-4 w-4" />
          Logga mejl
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
          <div key={email.id} className="space-y-1">
            {(email.customer || email.project) && (
              <div className="flex gap-2 text-xs text-muted-foreground px-1">
                {email.customer && (
                  <Link
                    href={`/kunder/${email.customer.id}`}
                    className="hover:underline"
                  >
                    {email.customer.companyName}
                  </Link>
                )}
                {email.customer && email.project && <span>/</span>}
                {email.project && (
                  <Link
                    href={`/projekt/${email.project.id}`}
                    className="hover:underline"
                  >
                    {email.project.name}
                  </Link>
                )}
              </div>
            )}
            <EmailLogList emails={[email]} />
          </div>
        ))}
        {emails.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">Inga mejl loggade</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {q ? "Inga mejl matchade sökningen." : "Börja logga mejl för att se dem här."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
