"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reopenInvoiceBasis } from "@/lib/actions/invoice-basis";

export function ReopenButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Vill du ångra detta underlag? Tidsposterna markeras som ofakturerade igen.")) return;
        startTransition(() => reopenInvoiceBasis(id));
      }}
    >
      <RotateCcw className="mr-2 h-4 w-4" />
      {isPending ? "Ångrar..." : "Ångra underlag"}
    </Button>
  );
}
