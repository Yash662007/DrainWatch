import { eq } from "drizzle-orm";
import { db } from "@/db";
import { inspections, workOrders } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";
import { generateId } from "@/lib/ids";
import { logEvent } from "@/lib/notify";
import { SLA_HOURS_BY_SEVERITY } from "@/lib/workOrderFormat";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { user, error } = await requireUser(["officer", "admin"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const inspectionId = body?.inspectionId;
  if (!inspectionId || typeof inspectionId !== "string") {
    return jsonError("inspectionId is required.", 400);
  }

  const [inspection] = await db.select().from(inspections).where(eq(inspections.id, inspectionId)).limit(1);
  if (!inspection) return jsonError("Inspection not found.", 404);
  if (!inspection.drainId) return jsonError("Inspection has no associated drain.", 400);
  if (inspection.workOrderId) return jsonError("A work order already exists for this inspection.", 409);

  const workOrderId = generateId("WO");
  const slaHours = SLA_HOURS_BY_SEVERITY[inspection.aiSeverity] ?? 24;

  await db.insert(workOrders).values({
    id: workOrderId,
    drainId: inspection.drainId,
    severity: inspection.aiSeverity,
    status: "reported",
    slaDueAt: new Date(Date.now() + slaHours * 3600000),
    description: `AI Generated: ${inspection.recommendation}`,
  });

  await db.update(inspections).set({ workOrderId }).where(eq(inspections.id, inspectionId));
  await logEvent(user.id, "work_order", workOrderId, "created_from_inspection", { inspectionId });

  return Response.json({ id: workOrderId, drainId: inspection.drainId });
}
