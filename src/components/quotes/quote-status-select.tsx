"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateQuoteStatus, convertToOrder } from "@/lib/actions/quotes";
import { quoteStatusLabels, quoteStatusColors } from "@/lib/status-colors";

const statuses = [
  { value: "draft", label: "Utkast" },
  { value: "sent", label: "Skickad" },
  { value: "accepted", label: "Accepterad" },
  { value: "rejected", label: "Avvisad" },
];

export function QuoteStatusSelect({
  quoteId,
  currentStatus,
}: {
  quoteId: string;
  currentStatus: string;
}) {
  const currentLabel = quoteStatusLabels[currentStatus] ?? currentStatus;

  if (currentStatus === "order") {
    return (
      <Badge className={quoteStatusColors[currentStatus] ?? ""}>
        {currentLabel}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Badge
          className={`cursor-pointer ${quoteStatusColors[currentStatus] ?? ""}`}
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
