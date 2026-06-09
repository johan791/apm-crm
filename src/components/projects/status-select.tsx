"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateProjectStatus } from "@/lib/actions/projects";
import { projectStatusLabels, projectStatusColors } from "@/lib/status-colors";

const statuses = [
  { value: "active", label: "Aktivt" },
  { value: "paused", label: "Pausat" },
  { value: "completed", label: "Avslutat" },
  { value: "cancelled", label: "Avbrutet" },
];

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
          className={`cursor-pointer ${projectStatusColors[currentStatus] ?? ""}`}
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
