import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const SESSION_COOKIE = "dw_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type Role = "citizen" | "worker" | "officer" | "admin";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export async function createSession(userId: number) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id, userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return id;
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    await db.delete(sessions).where(eq(sessions.id, id));
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const rows = await db
    .select({
      sessionExpiresAt: sessions.expiresAt,
      id: users.id,
      email: users.email,
      name: users.name,
      initial: users.initial,
      role: users.role,
      teamId: users.teamId,
      credits: users.credits,
      settings: users.settings,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.sessionExpiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  const { sessionExpiresAt, ...user } = row;
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function requireUser(allowedRoles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: jsonError("Not authenticated.", 401) };
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { user: null, error: jsonError("Not authorized for this action.", 403) };
  }
  return { user, error: null };
}
