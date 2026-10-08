import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH() {
  const { user, error } = await requireUser();
  if (error) return error;

  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));

  return Response.json({ ok: true });
}
