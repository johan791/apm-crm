"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Phone, Mail, Users, CheckCircle2, Circle, Clock, Trash2, MessageSquare, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateActivityStatus, deleteActivity } from "@/lib/actions/activities";
import { formatDate } from "@/lib/format";

const typeConfig: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  anteckning: { label: "Anteckning", icon: MessageSquare, color: "bg-accent-blue-subtle text-accent-blue" },
  samtal: { label: "Samtal", icon: Phone, color: "bg-accent-green-subtle text-accent-green" },
  mote: { label: "Möte", icon: Users, color: "bg-accent-teal-subtle text-accent-teal" },
  mejl: { label: "Mail", icon: Mail, color: "bg-accent-blue-subtle text-accent-blue" },
  uppgift: { label: "Uppgift", icon: ClipboardList, color: "bg-accent-amber-subtle text-accent-amber" },
  uppfoljning: { label: "Uppföljning", icon: Clock, color: "bg-accent-rose-subtle text-accent-rose" },
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

interface ActivityContext {
  customer?: { id: string; companyName: string } | null;
  project?: { id: string; name: string } | null;
}

interface ActivityListProps {
  activities: ActivityItem[];
  context?: ActivityContext;
}

export function ActivityList({ activities, context }: ActivityListProps) {
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
            className={`rounded-lg border bg-card p-3 ${
              !isOpen ? "opacity-60" : ""
            } ${isOverdue ? "border-l-3 border-l-destructive" : ""}`}
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
                className="mt-0.5 shrink-0 group"
                title={isOpen ? "Markera klar" : "Öppna igen"}
              >
                {isOpen ? (
                  <Circle className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                {context && (context.customer || context.project) && (
                  <div className="flex gap-1.5 text-sm text-muted-foreground mb-1">
                    {context.customer && (
                      <Link href={`/kunder/${context.customer.id}`} className="hover:underline">
                        {context.customer.companyName}
                      </Link>
                    )}
                    {context.customer && context.project && <span>/</span>}
                    {context.project && (
                      <Link href={`/projekt/${context.project.id}`} className="hover:underline">
                        {context.project.name}
                      </Link>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium ${config.color}`}>
                    <Icon className="h-2.5 w-2.5" />
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
                  <p className="font-medium mt-1">
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
                className="shrink-0 opacity-0 group-hover/card:opacity-100 focus:opacity-100 transition-opacity"
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
