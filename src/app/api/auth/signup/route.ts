import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, jsonError, type Role } from "@/lib/auth";
import { calculateLevel } from "@/lib/rewardConfig";

export const dynamic = "force-dynamic";

const ROLES: Role[] = ["citizen", "worker", "officer", "admin"];

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body.", 400);

  const { email, password, name, role } = body as {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
  };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return jsonError("A valid email is required.", 400);
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return jsonError("Password must be at least 6 characters.", 400);
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return jsonError("Name is required.", 400);
  }
  const chosenRole: Role = ROLES.includes(role as Role) ? (role as Role) : "citizen";

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return jsonError("An account with that email already exists.", 409);
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(password),
      name: name.trim(),
      initial: initialsOf(name),
      role: chosenRole,
      credits: 0,
    })
    .returning();

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
