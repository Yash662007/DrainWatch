import type { drains } from "@/db/schema";

type DrainRow = typeof drains.$inferSelect;

export function mapDrain(d: DrainRow) {
  return {
    id: d.id,
    ward: d.ward,
    location: d.location,
    coords: [d.lat, d.lng] as [number, number],
    severity: d.severity,
    type: d.type,
    status: d.status,
    risk: d.risk,
    waterLevel: d.waterLevel,
    blockage: d.blockage,
    assignedTeamId: d.assignedTeamId,
    lastInspection: d.lastInspectionAt ? d.lastInspectionAt.getTime() : null,
  };
}
