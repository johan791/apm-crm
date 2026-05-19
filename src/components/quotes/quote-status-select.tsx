"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateQuoteStatus, convertToOrder } from "@/lib/actions/quotes";

const statuses = [
  { value: "draft", label: "Utkast" },
  { value: "sent", label: "Skickad" },
  { value: "accepted", label: "Accepterad" },
  { value: "rejected", label: "Avvisad" },
];

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sent: "secondary",
  accepted: "default",
  rejected: "destructive",
  order: "default",
};

export function QuoteStatusSelect({
  quoteId,
  currentStatus,
}: {
  quoteId: string;
  currentStatus: string;
}) {
  const statusLabels: Record<string, string> = {
    draft: "Utkast",
    sent: "Skickad",
    accepted: "Accepterad",
    rejected: "Avvisad",
    order: "Order",
  };

  const currentLabel = statusLabels[currentStatus] ?? currentStatus;

  if (currentStatus === "order") {
    return (
      <Badge variant={statusVariants[currentStatus] ?? "outline"}>
        {currentLabel}
      </Badge>
    );
  }

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
            onClick={() => updateQuoteStatus(quoteId, s.value)}
          >
            {s.label}
          </DropdownMenuItem>
        ))}
        {currentStatus === "accepted" && (
          <>
            <DropdownMenuItem
              onClick={() => convertToOrder(quoteId)}
              className="font-medium text-primary"
            >
              Konvertera till order
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
