import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { drains, reports, users, workOrders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { calculateLevel } from "@/lib/rewardConfig";

export const dynamic = "force-dynamic";

async function individualLeaderboard(currentUserId: number) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      credits: users.credits,
      total: sql<number>`count(${reports.id})`,
      verified: sql<number>`count(*) filter (where ${reports.status} = 'verified')`,
    })
    .from(users)
    .leftJoin(reports, eq(reports.reporterId, users.id))
    .groupBy(users.id, users.name, users.credits)
    .orderBy(desc(users.credits))
    .limit(20);

  return rows.map((r) => {
    const total = Number(r.total);
    const verified = Number(r.verified);
    return {
      name: r.name,
      credits: r.credits,
      impact: total === 0 ? 0 : Math.round((verified / total) * 100),
      level: calculateLevel(r.credits).name,
      isMe: r.id === currentUserId,
    };
  });
}

async function groupedLeaderboard(groupBy: "ward" | "location") {
  const column = groupBy === "ward" ? drains.ward : drains.location;
  const rows = await db
    .select({
      name: column,
      reportCount: sql<number>`count(distinct ${reports.id})`,
      resolvedCount: sql<number>`count(distinct ${workOrders.id}) filter (where ${workOrders.status} in ('resolved', 'closed'))`,
    })
    .from(drains)
    .leftJoin(reports, eq(reports.drainId, drains.id))
    .leftJoin(workOrders, eq(workOrders.drainId, drains.id))
    .groupBy(column)
    .orderBy(desc(sql`count(distinct ${reports.id})`))
    .limit(20);

  return rows.map((r) => {
    const reportCount = Number(r.reportCount);
    const resolvedCount = Number(r.resolvedCount);
    return {
      name: r.name,
      reports: reportCount,
      resolved: resolvedCount,
      score: reportCount === 0 ? 0 : Math.min(100, Math.round((resolvedCount / reportCount) * 100)),
    };
  });
}

export async function GET(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const scope = new URL(request.url).searchParams.get("scope") || "individual";

  if (scope === "ward") return Response.json(await groupedLeaderboard("ward"));
  if (scope === "locality") return Response.json(await groupedLeaderboard("location"));
  return Response.json(await individualLeaderboard(user.id));
}
