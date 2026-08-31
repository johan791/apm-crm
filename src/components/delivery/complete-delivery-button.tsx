"use client";

import { useState } from "react";
import { CheckCircle2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { company } from "@/lib/company";
import {
  completeDeliveryEvent,
  reopenDeliveryEvent,
} from "@/lib/actions/delivery-events";

interface CompleteDeliveryButtonProps {
  eventId: string;
  completedAt: Date | null;
  completedByName?: string | null;
  completionNote?: string | null;
}

export function CompleteDeliveryButton({
  eventId,
  completedAt,
  completedByName,
  completionNote,
}: CompleteDeliveryButtonProps) {
  const [open, setOpen] = useState(false);

  if (completedAt) {
    const reopenWithId = reopenDeliveryEvent.bind(null, eventId);
    return (
      <div className="rounded-lg border border-status-active bg-status-active-bg/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-active" />
            <div>
              <p className="font-medium">
                Genomförd {new Date(completedAt).toLocaleDateString("sv-SE")}
              </p>
              {completedByName && (
                <p className="text-muted-foreground">
                  Bekräftad av {completedByName}
                </p>
              )}
              {completionNote && (
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {completionNote}
                </p>
              )}
            </div>
          </div>
          <form action={reopenWithId}>
            <Button type="submit" variant="ghost" size="sm">
              <Undo2 className="mr-2 h-4 w-4" />
              Ångra
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const completeWithId = completeDeliveryEvent.bind(null, eventId);

  return (
    <form action={completeWithId} className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Händelsen är ännu inte markerad som genomförd.
        </p>
        {open ? (
          <Button type="submit" size="sm">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Bekräfta genomförd
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Markera som genomförd
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          <Label htmlFor="completionNote">Kommentar (valfritt)</Label>
          <textarea
            id="completionNote"
            name="completionNote"
            rows={2}
            placeholder="Avvikelser, mottagare på plats, restposter..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <p className="text-xs text-muted-foreground">
            En bekräftelse mailas till {company.email} när du sparar.
          </p>
        </div>
      )}
    </form>
  );
}
