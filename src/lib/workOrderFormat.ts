export const STATUS_DISPLAY: Record<string, string> = {
  reported: "Reported",
  verified: "Verified",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  verification_pending: "Verification Pending",
  closed: "Closed",
};

export function displayStatus(dbStatus: string) {
  return STATUS_DISPLAY[dbStatus] ?? dbStatus;
}

export function dbStatusFromDisplay(display: string) {
  const entry = Object.entries(STATUS_DISPLAY).find(([, v]) => v === display);
  return entry?.[0];
}

export function formatSla(slaDueAt: Date, status: string) {
  if (status === "resolved" || status === "closed") return "Completed";
  const diffMs = slaDueAt.getTime() - Date.now();
  if (diffMs <= 0) return "Overdue";
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

// Severity -> hours until SLA breach, used when a work order is created.
export const SLA_HOURS_BY_SEVERITY: Record<string, number> = {
  critical: 4,
  "high-risk": 12,
  warning: 48,
  healthy: 96,
};
