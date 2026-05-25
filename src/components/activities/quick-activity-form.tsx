"use client";

import { useState, useTransition } from "react";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createActivity } from "@/lib/actions/activities";

const types = [
  { value: "anteckning", label: "Anteckning" },
  { value: "samtal", label: "Samtal" },
  { value: "mote", label: "Möte" },
  { value: "mejl", label: "Mejl" },
  { value: "uppgift", label: "Uppgift" },
  { value: "uppfoljning", label: "Uppföljning" },
];

interface QuickActivityFormProps {
  customerId?: string;
  projectId?: string;
}

export function QuickActivityForm({
  customerId,
  projectId,
}: QuickActivityFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(true)}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Ny aktivitet
      </Button>
    );
  }

  return (
    <form
      className="space-y-3 rounded-md border p-3 bg-muted/30"
      action={(formData) => {
        startTransition(async () => {
          await createActivity(formData);
          setShowForm(false);
        });
      }}
    >
      {customerId && (
        <input type="hidden" name="customerId" value={customerId} />
      )}
      {projectId && (
        <input type="hidden" name="projectId" value={projectId} />
      )}

      <div className="flex gap-2 flex-wrap">
        {types.map((t) => (
          <label key={t.value} className="cursor-pointer">
            <input
              type="radio"
              name="type"
              value={t.value}
              defaultChecked={t.value === "anteckning"}
              className="peer sr-only"
            />
            <span className="inline-block rounded-full border px-3 py-1 text-xs font-medium transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary hover:bg-muted">
              {t.label}
            </span>
          </label>
        ))}
      </div>

      <div className="space-y-1">
        <Label htmlFor="activity-desc" className="text-xs">
          Beskrivning *
        </Label>
        <textarea
          id="activity-desc"
          name="description"
          required
          rows={3}
          autoFocus
          placeholder="Vad hände? Vad ska göras?"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="activity-title" className="text-xs">
            Titel (valfri)
          </Label>
          <Input
            id="activity-title"
            name="title"
            placeholder="Kort rubrik"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="activity-due" className="text-xs">
            Förfallodatum
          </Label>
          <Input id="activity-due" name="dueDate" type="date" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          <Check className="mr-1 h-3.5 w-3.5" />
          Spara
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(false)}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Avbryt
        </Button>
      </div>
    </form>
  );
}
