"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DateFilter({
  from,
  to,
  projectId,
}: {
  from?: string;
  to?: string;
  projectId: string;
}) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from ?? "");
  const [toDate, setToDate] = useState(to ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const qs = params.toString();
    router.push(`/projekt/${projectId}/tid/skriv-ut${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="h-9 w-36"
      />
      <span className="text-sm text-muted-foreground">—</span>
      <Input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="h-9 w-36"
      />
      <Button size="sm" variant="secondary" onClick={apply}>
        Visa
      </Button>
    </div>
  );
}
