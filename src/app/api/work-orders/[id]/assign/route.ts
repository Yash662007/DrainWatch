import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams, users, workOrders } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";
import { logEvent, notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser(["officer", "admin"]);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const teamId = body?.teamId;
  if (!teamId || typeof teamId !== "number") return jsonError("teamId is required.", 400);

  const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
  if (!wo) return jsonError("Work order not found.", 404);

  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) return jsonError("Team not found.", 404);

  await db
    .update(workOrders)
    .set({ teamId, status: "assigned", assignedAt: new Date() })
    .where(eq(workOrders.id, id));

  const teamWorkers = await db.select({ id: users.id }).from(users).where(eq(users.teamId, teamId));
  for (const w of teamWorkers) {
    await notify(w.id, "work_order", "New task assigned", `${team.name} has been assigned work order ${id}.`, "work_order", id);
  }

  await logEvent(user.id, "work_order", id, "assigned", { teamId, teamName: team.name });

  return Response.json({ ok: true });
}
