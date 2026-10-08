import { eq } from "drizzle-orm";
import { db } from "@/db";
import { drains, teams, workOrders } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";
import { displayStatus, formatSla } from "@/lib/workOrderFormat";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser(["officer", "admin", "worker"]);
  if (error) return error;

  const { id } = await params;
  const rows = await db
    .select({
      id: workOrders.id,
      drainId: workOrders.drainId,
      location: drains.location,
      severity: workOrders.severity,
      status: workOrders.status,
      slaDueAt: workOrders.slaDueAt,
      description: workOrders.description,
      createdAt: workOrders.createdAt,
      teamName: teams.name,
      teamId: workOrders.teamId,
      reportId: workOrders.reportId,
      beforePhotoUrl: workOrders.beforePhotoUrl,
      afterPhotoUrl: workOrders.afterPhotoUrl,
      resolutionNotes: workOrders.resolutionNotes,
      improvementPct: workOrders.improvementPct,
    })
    .from(workOrders)
    .innerJoin(drains, eq(workOrders.drainId, drains.id))
    .leftJoin(teams, eq(workOrders.teamId, teams.id))
    .where(eq(workOrders.id, id))
    .limit(1);

  const w = rows[0];
  if (!w) return jsonError("Work order not found.", 404);

  return Response.json({
    id: w.id,
    drainId: w.drainId,
    location: w.location,
    severity: w.severity,
    team: w.teamName,
    teamId: w.teamId,
    created: w.createdAt.getTime(),
    status: displayStatus(w.status),
    sla: formatSla(w.slaDueAt, w.status),
    description: w.description,
    reportId: w.reportId,
    beforePhotoUrl: w.beforePhotoUrl,
    afterPhotoUrl: w.afterPhotoUrl,
    resolutionNotes: w.resolutionNotes,
    improvementPct: w.improvementPct,
  });
}
