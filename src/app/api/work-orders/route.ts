import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { drains, teams, workOrders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { displayStatus, formatSla } from "@/lib/workOrderFormat";

export const dynamic = "force-dynamic";

async function listWorkOrders() {
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
      reportId: workOrders.reportId,
      beforePhotoUrl: workOrders.beforePhotoUrl,
      afterPhotoUrl: workOrders.afterPhotoUrl,
      resolutionNotes: workOrders.resolutionNotes,
      improvementPct: workOrders.improvementPct,
    })
    .from(workOrders)
    .innerJoin(drains, eq(workOrders.drainId, drains.id))
    .leftJoin(teams, eq(workOrders.teamId, teams.id))
    .orderBy(desc(workOrders.createdAt));

  return rows.map((w) => ({
    id: w.id,
    drainId: w.drainId,
    location: w.location,
    severity: w.severity,
    team: w.teamName,
    created: w.createdAt.getTime(),
    status: displayStatus(w.status),
    sla: formatSla(w.slaDueAt, w.status),
    description: w.description,
    reportId: w.reportId,
    beforePhotoUrl: w.beforePhotoUrl,
    afterPhotoUrl: w.afterPhotoUrl,
    resolutionNotes: w.resolutionNotes,
    improvementPct: w.improvementPct,
  }));
}

export async function GET() {
  const { error } = await requireUser(["officer", "admin"]);
  if (error) return error;

  return Response.json(await listWorkOrders());
}
