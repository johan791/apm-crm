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
import { deleteCustomer } from "@/lib/actions/customers";
import { useState } from "react";

export function DeleteCustomerButton({ id }: { id: string }) {
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
          <DialogTitle>Ta bort kund</DialogTitle>
          <DialogDescription>
            Är du säker? Alla projekt kopplade till denna kund måste tas bort
            först.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteCustomer(id)}
          >
            Ta bort
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
