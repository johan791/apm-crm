"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { deleteProject } from "@/lib/actions/projects";
import { useState } from "react";

export function DeleteProjectButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="destructive" size="sm" />}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Ta bort
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ta bort projekt</DialogTitle>
          <DialogDescription>
            Är du säker på att du vill ta bort detta projekt? Åtgärden kan inte
            ångras.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button variant="destructive" onClick={() => deleteProject(id)}>
            Ta bort
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
