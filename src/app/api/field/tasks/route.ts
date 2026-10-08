import { and, desc, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { drains, workOrders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { displayStatus, formatSla } from "@/lib/workOrderFormat";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireUser(["worker"]);
  if (error) return error;

  if (!user.teamId) return Response.json([]);

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
    })
    .from(workOrders)
    .innerJoin(drains, eq(workOrders.drainId, drains.id))
    .where(and(eq(workOrders.teamId, user.teamId), notInArray(workOrders.status, ["resolved", "closed"])))
    .orderBy(desc(workOrders.createdAt));

  return Response.json(
    rows.map((w) => ({
      id: w.id,
      drainId: w.drainId,
      location: w.location,
      severity: w.severity,
      status: displayStatus(w.status),
      sla: formatSla(w.slaDueAt, w.status),
      description: w.description,
      created: w.createdAt.getTime(),
    }))
  );
}
