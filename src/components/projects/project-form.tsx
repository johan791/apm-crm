"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project, Customer, User, Contact } from "@/generated/prisma";

interface ProjectFormProps {
  action: (formData: FormData) => Promise<void>;
  customers: Customer[];
  project?: Project;
  defaultCustomerId?: string;
  users?: User[];
  contacts?: Contact[];
  /** Övriga kontaktpersoner utöver huvudkontakten, som redan är kopplade. */
  extraContactIds?: string[];
}

const statuses = [
  { value: "active", label: "Aktivt" },
  { value: "paused", label: "Pausat" },
  { value: "completed", label: "Avslutat" },
  { value: "cancelled", label: "Avbrutet" },
];

function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

export function ProjectForm({
  action,
  customers,
  project,
  defaultCustomerId,
  users,
  contacts,
  extraContactIds,
}: ProjectFormProps) {
  const [customerId, setCustomerId] = useState(
    project?.customerId ?? defaultCustomerId ?? ""
  );
  const [primaryContactId, setPrimaryContactId] = useState(
    project?.contactId ?? ""
  );
  const customerContacts = (contacts ?? []).filter(
    (c) => c.customerId === customerId
  );
  // Huvudkontakten ska inte kunna kryssas i som extra också.
  const selectableExtras = customerContacts.filter(
    (c) => c.id !== primaryContactId
  );

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle>
            {project ? "Redigera projekt" : "Nytt projekt"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Projektnamn *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={project?.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Kund *</Label>
              <select
                id="customerId"
                name="customerId"
                required
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  // Kontakterna hör till kunden — byter man kund är de gamla
                  // valen inte längre giltiga.
                  setPrimaryContactId("");
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled>
                  Välj kund...
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactId">Huvudkontaktperson</Label>
            <select
              id="contactId"
              name="contactId"
              key={customerId}
              value={primaryContactId}
              onChange={(e) => setPrimaryContactId(e.target.value)}
              disabled={!customerId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Ingen kontaktperson</option>
              {customerContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.role ? ` – ${c.role}` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {!customerId
                ? "Välj kund först."
                : customerContacts.length === 0
                  ? "Kunden har inga registrerade kontaktpersoner ännu – lägg till dem på kundkortet."
                  : "Kontaktpersonen hos kunden som projektet drivs mot."}
            </p>
          </div>

          {selectableExtras.length > 0 && (
            <div className="space-y-2">
              <Label>Fler kontaktpersoner</Label>
              <div className="space-y-2 rounded-md border p-3">
                {selectableExtras.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="extraContactIds"
                      value={c.id}
                      defaultChecked={extraContactIds?.includes(c.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span>
                      {c.name}
                      {c.role ? (
                        <span className="text-muted-foreground">
                          {" "}
                          – {c.role}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Till exempel den som beställt och den som är på plats vid
                leverans. Huvudkontakten är den som står på projektkortet.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={project?.description ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={project?.status ?? "active"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Timpris (kr)</Label>
              <Input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={project?.hourlyRate?.toString() ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsibleUserId">Ansvarig</Label>
              <select
                id="responsibleUserId"
                name="responsibleUserId"
                defaultValue={project?.responsibleUserId ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Ingen ansvarig</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Startdatum</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={formatDate(project?.startDate)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Slutdatum</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={formatDate(project?.endDate)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onedriveFolderUrl">OneDrive-mapp</Label>
            <Input
              id="onedriveFolderUrl"
              name="onedriveFolderUrl"
              type="url"
              placeholder="https://onedrive.live.com/..."
              defaultValue={project?.onedriveFolderUrl ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Länk till projektmappen i OneDrive för ritningar, moodboards och dokument.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">
              {project ? "Spara ändringar" : "Skapa projekt"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
