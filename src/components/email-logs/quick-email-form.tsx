"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmailLog } from "@/lib/actions/email-logs";

interface QuickEmailFormProps {
  customerId?: string;
  projectId?: string;
}

export function QuickEmailForm({ customerId, projectId }: QuickEmailFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-3.5 w-3.5" />
        Logga mail
      </Button>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await createEmailLog(formData);
          setOpen(false);
        });
      }}
      className="rounded-md border p-3 space-y-3"
    >
      {customerId && <input type="hidden" name="customerId" value={customerId} />}
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      <div className="flex gap-2">
        <label className="cursor-pointer">
          <input type="radio" name="direction" value="ut" defaultChecked className="peer sr-only" />
          <span className="inline-block rounded-full border px-3 py-1 text-sm font-medium transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary hover:bg-muted">
            Utgående
          </span>
        </label>
        <label className="cursor-pointer">
          <input type="radio" name="direction" value="in" className="peer sr-only" />
          <span className="inline-block rounded-full border px-3 py-1 text-sm font-medium transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary hover:bg-muted">
            Inkommande
          </span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="qe-subject">Ämne *</Label>
          <Input id="qe-subject" name="subject" required placeholder="Ämnesrad" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="qe-counterpart">Motpart *</Label>
          <Input id="qe-counterpart" name="counterpart" required placeholder="E-postadress eller namn" />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="qe-body">Innehåll</Label>
        <textarea
          id="qe-body"
          name="body"
          rows={3}
          placeholder="Klistra in eller sammanfatta mailet..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Sparar..." : "Spara"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Avbryt
        </Button>
      </div>
    </form>
  );
}
