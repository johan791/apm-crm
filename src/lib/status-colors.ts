export const projectStatusLabels: Record<string, string> = {
  active: "Aktivt",
  completed: "Avslutat",
  paused: "Pausat",
  cancelled: "Avbrutet",
};

export const projectStatusColors: Record<string, string> = {
  active: "bg-status-active-bg text-status-active border-transparent",
  completed: "bg-status-completed-bg text-status-completed border-transparent",
  paused: "bg-status-paused-bg text-status-paused border-transparent",
  cancelled: "bg-status-cancelled-bg text-status-cancelled border-transparent",
};

export const invoiceStatusLabels: Record<string, string> = {
  skapad: "Skapad",
  skickad: "Skickad",
  betald: "Betald",
};

export const invoiceStatusColors: Record<string, string> = {
  skapad: "bg-status-paused-bg text-status-paused border-transparent",
  skickad: "bg-accent-blue-subtle text-accent-blue border-transparent",
  betald: "bg-status-active-bg text-status-active border-transparent",
};

export const quoteStatusLabels: Record<string, string> = {
  draft: "Utkast",
  sent: "Skickad",
  accepted: "Accepterad",
  rejected: "Avvisad",
  order: "Order",
};

export const quoteStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  sent: "bg-accent-blue-subtle text-accent-blue border-transparent",
  accepted: "bg-status-active-bg text-status-active border-transparent",
  rejected: "bg-status-cancelled-bg text-status-cancelled border-transparent",
  order: "bg-status-active-bg text-status-active border-transparent",
};
