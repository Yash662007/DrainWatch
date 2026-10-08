import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, parseInt(id, 10)), eq(notifications.userId, user.id)));

  return Response.json({ ok: true });
}
