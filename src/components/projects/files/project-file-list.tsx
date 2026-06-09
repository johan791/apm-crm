"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Trash2, Plus, FileImage, FileText, Receipt, Hammer, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProjectFile, deleteProjectFile } from "@/lib/actions/project-files";

const categoryConfig: Record<string, { label: string; icon: typeof File; color: string }> = {
  moodboard: { label: "Moodboard", icon: FileImage, color: "text-accent-rose" },
  ritning: { label: "Ritning", icon: FileText, color: "text-accent-blue" },
  leverantorsfaktura: { label: "Leverantörsfaktura", icon: Receipt, color: "text-accent-amber" },
  bild: { label: "Bild", icon: FileImage, color: "text-accent-green" },
  offert: { label: "Offert", icon: FileText, color: "text-accent-teal" },
  avtal: { label: "Avtal", icon: FileText, color: "text-primary" },
  ovrigt: { label: "Övrigt", icon: File, color: "text-muted-foreground" },
};

interface ProjectFileItem {
  id: string;
  name: string;
  url: string;
  category: string;
  createdAt: Date;
}

export function ProjectFileList({
  projectId,
  files,
}: {
  projectId: string;
  files: ProjectFileItem[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => {
            const config = categoryConfig[file.category] ?? categoryConfig.ovrigt;
            const Icon = config.icon;
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    {file.name}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => deleteProjectFile(file.id, projectId))
                  }
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Inga dokument länkade ännu.
        </p>
      )}

      {showForm ? (
        <form
          action={(formData) => {
            startTransition(async () => {
              await addProjectFile(formData);
              setShowForm(false);
            });
          }}
          className="rounded-md border p-3 space-y-3"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="file-name" className="text-xs">Namn *</Label>
              <Input
                id="file-name"
                name="name"
                required
                placeholder="T.ex. Moodboard kontor"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="file-category" className="text-xs">Kategori</Label>
              <select
                id="file-category"
                name="category"
                defaultValue="ovrigt"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {Object.entries(categoryConfig).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="file-url" className="text-xs">Länk *</Label>
            <Input
              id="file-url"
              name="url"
              type="url"
              required
              placeholder="https://onedrive.live.com/... eller annan länk"
              className="h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              Spara
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Avbryt
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Lägg till dokument
        </Button>
      )}
    </div>
  );
}
