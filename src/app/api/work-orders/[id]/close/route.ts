import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";
import { logEvent } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser(["worker", "officer", "admin"]);
  if (error) return error;

  const { id } = await params;
  const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
  if (!wo) return jsonError("Work order not found.", 404);

  if (user.role === "worker" && wo.teamId !== user.teamId) {
    return jsonError("This work order is not assigned to your team.", 403);
  }

  await db.update(workOrders).set({ status: "closed", closedAt: new Date() }).where(eq(workOrders.id, id));
  await logEvent(user.id, "work_order", id, "closed", {});

  return Response.json({ ok: true });
}
