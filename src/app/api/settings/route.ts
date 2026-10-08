import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Invalid JSON body.", 400);

  const current = (user.settings as Record<string, unknown>) || {};
  const merged = { ...current, ...body };

  await db.update(users).set({ settings: merged }).where(eq(users.id, user.id));

  return Response.json({ settings: merged });
}
