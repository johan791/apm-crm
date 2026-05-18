"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateProjectStatus } from "@/lib/actions/projects";

const statuses = [
  { value: "active", label: "Aktivt" },
  { value: "paused", label: "Pausat" },
  { value: "completed", label: "Avslutat" },
  { value: "cancelled", label: "Avbrutet" },
];

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  completed: "secondary",
  paused: "outline",
  cancelled: "destructive",
};

export function StatusSelect({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: string;
}) {
  const currentLabel =
    statuses.find((s) => s.value === currentStatus)?.label ?? currentStatus;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Badge
          variant={statusVariants[currentStatus] ?? "outline"}
          className="cursor-pointer"
        >
          {currentLabel}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={() => updateProjectStatus(projectId, s.value)}
          >
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
