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
import { deletePartner } from "@/lib/actions/partners";
import { useState } from "react";

export function DeletePartnerButton({ id }: { id: string }) {
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
          <DialogTitle>Ta bort partner</DialogTitle>
          <DialogDescription>
            Är du säker? Partnern tas bort från alla projektkopplingar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            variant="destructive"
            onClick={() => deletePartner(id)}
          >
            Ta bort
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
