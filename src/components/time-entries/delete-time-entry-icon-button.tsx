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
import { deleteTimeEntry } from "@/lib/actions/time-entries";
import { useState } from "react";

export function DeleteTimeEntryIconButton({
  id,
  projectId,
  returnTo,
}: {
  id: string;
  projectId: string;
  returnTo?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ta bort tidspost</DialogTitle>
          <DialogDescription>
            Är du säker på att du vill ta bort denna tidspost? Åtgärden kan inte
            ångras.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteTimeEntry(id, projectId, returnTo)}
          >
            Ta bort
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
