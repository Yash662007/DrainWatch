import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { badgeDefinitions, reports, userBadges, users } from "@/db/schema";
import { notify } from "@/lib/notify";

const MONSOON_MONTHS = [5, 6, 7, 8]; // June-September (0-indexed)

async function badgeSatisfied(
  userId: number,
  type: string,
  threshold: number
): Promise<boolean> {
  if (type === "credits") {
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1);
    return (user?.credits ?? 0) >= threshold;
  }

  if (type === "reports") {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(and(eq(reports.reporterId, userId), eq(reports.status, "verified")));
    return Number(row?.count ?? 0) >= threshold;
  }

  if (type === "accuracy") {
    const [row] = await db
      .select({
        total: sql<number>`count(*)`,
        verified: sql<number>`count(*) filter (where ${reports.status} = 'verified')`,
      })
      .from(reports)
      .where(eq(reports.reporterId, userId));
    const total = Number(row?.total ?? 0);
    const verified = Number(row?.verified ?? 0);
    if (total === 0) return false;
    return (verified / total) * 100 >= threshold;
  }

  if (type === "ward-reports") {
    const rows = await db
      .select({ ward: reports.wardGuess, count: sql<number>`count(*)` })
      .from(reports)
      .where(and(eq(reports.reporterId, userId), eq(reports.status, "verified")))
      .groupBy(reports.wardGuess);
    return rows.some((r) => Number(r.count) >= threshold);
  }

  if (type === "seasonal") {
    const rows = await db
      .select({ createdAt: reports.createdAt })
      .from(reports)
      .where(and(eq(reports.reporterId, userId), eq(reports.status, "verified")));
    return rows.some((r) => MONSOON_MONTHS.includes(r.createdAt.getMonth()));
  }

  return false;
}

async function badgeProgress(userId: number, type: string, threshold: number): Promise<number> {
  if (type === "credits") {
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1);
    return Math.min(100, Math.round(((user?.credits ?? 0) / threshold) * 100));
  }
  if (type === "reports") {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(and(eq(reports.reporterId, userId), eq(reports.status, "verified")));
    return Math.min(100, Math.round((Number(row?.count ?? 0) / threshold) * 100));
  }
  if (type === "accuracy") {
    const [row] = await db
      .select({
        total: sql<number>`count(*)`,
        verified: sql<number>`count(*) filter (where ${reports.status} = 'verified')`,
      })
      .from(reports)
      .where(eq(reports.reporterId, userId));
    const total = Number(row?.total ?? 0);
    if (total === 0) return 0;
    const accuracy = (Number(row?.verified ?? 0) / total) * 100;
    return Math.min(100, Math.round((accuracy / threshold) * 100));
  }
  if (type === "ward-reports") {
    const rows = await db
      .select({ ward: reports.wardGuess, count: sql<number>`count(*)` })
      .from(reports)
      .where(and(eq(reports.reporterId, userId), eq(reports.status, "verified")))
      .groupBy(reports.wardGuess);
    const max = rows.reduce((m, r) => Math.max(m, Number(r.count)), 0);
    return Math.min(100, Math.round((max / threshold) * 100));
  }
  return 0;
}

export async function getBadgeProgress(userId: number) {
  const definitions = await db.select().from(badgeDefinitions);
  const unlocked = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const unlockedMap = new Map(unlocked.map((u) => [u.badgeId, u.unlockedAt]));

  return Promise.all(
    definitions.map(async (badge) => {
      const isUnlocked = unlockedMap.has(badge.id);
      return {
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        desc: badge.desc,
        type: badge.type,
        unlocked: isUnlocked,
        unlockedAt: unlockedMap.get(badge.id) ?? null,
        progress: isUnlocked ? 100 : await badgeProgress(userId, badge.type, badge.threshold),
      };
    })
  );
}

export async function evaluateBadges(userId: number) {
  const definitions = await db.select().from(badgeDefinitions);
  const unlocked = await db.select({ badgeId: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId));
  const unlockedIds = new Set(unlocked.map((u) => u.badgeId));

  for (const badge of definitions) {
    if (unlockedIds.has(badge.id)) continue;
    const satisfied = await badgeSatisfied(userId, badge.type, badge.threshold);
    if (satisfied) {
      await db.insert(userBadges).values({ userId, badgeId: badge.id }).onConflictDoNothing();
      await notify(
        userId,
        "badge_unlocked",
        `Badge unlocked: ${badge.name}`,
        badge.desc,
        "badge",
        badge.id
      );
    }
  }
}
