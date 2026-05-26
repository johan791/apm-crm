"use client";

import { useTransition } from "react";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteEmailLog } from "@/lib/actions/email-logs";
import { formatDate } from "@/lib/format";

interface EmailLogItem {
  id: string;
  subject: string;
  body: string | null;
  counterpart: string;
  direction: string;
  sentAt: Date;
  createdBy: { name: string };
}

export function EmailLogList({ emails }: { emails: EmailLogItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (emails.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Inga loggade mejl ännu.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {emails.map((email) => (
        <div key={email.id} className="rounded-md border p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {email.direction === "in" ? (
                <ArrowDownLeft className="h-4 w-4 text-blue-500" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{email.subject}</span>
                <span className="text-xs text-muted-foreground">
                  {email.direction === "in" ? "från" : "till"} {email.counterpart}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(email.sentAt)}
                </span>
              </div>
              {email.body && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">
                  {email.body}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Loggad av {email.createdBy.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(() => deleteEmailLog(email.id))
              }
              className="shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
