"use client";

import { useState, useTransition } from "react";
import { Phone, Mail, Users, FileText, CheckCircle2, Circle, Clock, Trash2, MessageSquare, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateActivityStatus, deleteActivity } from "@/lib/actions/activities";
import { formatDate } from "@/lib/format";

const typeConfig: Record<string, { label: string; icon: typeof Phone }> = {
  anteckning: { label: "Anteckning", icon: MessageSquare },
  samtal: { label: "Samtal", icon: Phone },
  mote: { label: "Möte", icon: Users },
  mejl: { label: "Mejl", icon: Mail },
  uppgift: { label: "Uppgift", icon: ClipboardList },
  uppfoljning: { label: "Uppföljning", icon: Clock },
};

interface ActivityItem {
  id: string;
  type: string;
  title: string | null;
  description: string;
  status: string;
  dueDate: Date | null;
  createdBy: { name: string };
  assignedTo: { name: string } | null;
  createdAt: Date;
}

interface ActivityListProps {
  activities: ActivityItem[];
}

export function ActivityList({ activities }: ActivityListProps) {
  const [isPending, startTransition] = useTransition();

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Inga aktiviteter ännu.
      </p>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-2">
      {activities.map((activity) => {
        const config = typeConfig[activity.type] ?? typeConfig.anteckning;
        const Icon = config.icon;
        const isOpen = activity.status === "oppen";
        const isOverdue =
          isOpen &&
          activity.dueDate &&
          new Date(activity.dueDate) < today;

        return (
          <div
            key={activity.id}
            className={`rounded-md border p-3 ${
              !isOpen ? "opacity-60" : ""
            } ${isOverdue ? "border-destructive/50 bg-destructive/5" : ""}`}
          >
            <div className="flex items-start gap-3">
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(() =>
                    updateActivityStatus(
                      activity.id,
                      isOpen ? "klar" : "oppen"
                    )
                  )
                }
                className="mt-0.5 shrink-0"
                title={isOpen ? "Markera klar" : "Öppna igen"}
              >
                {isOpen ? (
                  <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </span>
                  {activity.dueDate && (
                    <span
                      className={`text-xs ${
                        isOverdue
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isOverdue ? "Förfallen " : ""}
                      {formatDate(activity.dueDate)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {activity.createdBy.name}
                  </span>
                </div>

                {activity.title && (
                  <p className="text-sm font-medium mt-0.5">
                    {activity.title}
                  </p>
                )}
                <p
                  className={`text-sm mt-0.5 whitespace-pre-wrap ${
                    activity.title ? "text-muted-foreground" : ""
                  }`}
                >
                  {activity.description}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => deleteActivity(activity.id))
                }
                className="shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
