"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Customer, DeliveryEvent } from "@/generated/prisma";

const eventTypeLabels: Record<string, string> = {
  delivery: "Leverans",
  installation: "Installation",
  pickup: "Upphämtning",
};

interface ProjectWithCustomer {
  id: string;
  name: string;
  customer: { id: string; companyName: string };
}

interface DeliveryEventFormProps {
  action: (formData: FormData) => Promise<void>;
  projects: ProjectWithCustomer[];
  customers: Customer[];
  event?: DeliveryEvent;
  defaultProjectId?: string;
}

export function DeliveryEventForm({
  action,
  projects,
  customers,
  event,
  defaultProjectId,
}: DeliveryEventFormProps) {
  const initialProjectId = event?.projectId ?? defaultProjectId ?? "";
  const initialProject = projects.find((p) => p.id === initialProjectId);
  const initialCustomerId =
    event?.customerId ?? initialProject?.customer.id ?? "";

  const [selectedProjectId, setSelectedProjectId] =
    useState(initialProjectId);
  const [selectedCustomerId, setSelectedCustomerId] =
    useState(initialCustomerId);

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setSelectedCustomerId(project.customer.id);
    }
  }

  // Format date for the input
  const dateValue = event?.date
    ? new Date(event.date).toISOString().split("T")[0]
    : "";

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle>
            {event ? "Redigera händelse" : "Ny händelse"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Typ *</Label>
              <select
                id="type"
                name="type"
                required
                defaultValue={event?.type ?? "delivery"}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
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
                defaultValue={dateValue}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="time">Tid</Label>
              <Input
                id="time"
                name="time"
                type="time"
                defaultValue={event?.time ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Projekt *</Label>
              <select
                id="projectId"
                name="projectId"
                required
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Välj projekt...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.customer.companyName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Kund *</Label>
              <select
                id="customerId"
                name="customerId"
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Välj kund...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adress</Label>
              <Input
                id="address"
                name="address"
                defaultValue={event?.address ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={event?.notes ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">
              {event ? "Spara ändringar" : "Skapa händelse"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
