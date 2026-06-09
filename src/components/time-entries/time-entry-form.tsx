"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface TimeEntryFormProps {
  action: (formData: FormData) => Promise<void>;
  projects: Array<{ id: string; name: string; customer: { companyName: string } }>;
  timeEntry?: {
    projectId: string;
    date: Date;
    hours: { toString(): string };
    description: string | null;
  };
  defaultProjectId?: string;
  returnTo?: string;
}

function formatDateValue(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

export function TimeEntryForm({
  action,
  projects,
  timeEntry,
  defaultProjectId,
  returnTo,
}: TimeEntryFormProps) {
  return (
    <form action={action}>
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <Card>
        <CardHeader>
          <CardTitle>
            {timeEntry ? "Redigera tidspost" : "Ny tidspost"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="projectId">Projekt *</Label>
              <select
                id="projectId"
                name="projectId"
                required
                defaultValue={
                  timeEntry?.projectId ?? defaultProjectId ?? ""
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>
                  Välj projekt...
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.customer.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={
                  timeEntry
                    ? formatDateValue(timeEntry.date)
                    : new Date().toISOString().split("T")[0]
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hours">Timmar *</Label>
              <Input
                id="hours"
                name="hours"
                type="number"
                step="0.25"
                min="0.25"
                required
                defaultValue={timeEntry?.hours?.toString() ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={timeEntry?.description ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">
              {timeEntry ? "Spara ändringar" : "Skapa tidspost"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
