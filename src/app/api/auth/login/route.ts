import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, jsonError, verifyPassword } from "@/lib/auth";
import { calculateLevel } from "@/lib/rewardConfig";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body.", 400);

  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return jsonError("Email and password are required.", 400);
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return jsonError("Invalid email or password.", 401);
  }

  await createSession(user.id);

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      initial: user.initial,
      role: user.role,
      credits: user.credits,
      level: calculateLevel(user.credits).name,
    },
  });
}
