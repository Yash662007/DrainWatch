import { sql } from "drizzle-orm";
import { db } from "@/db";
import { drains, reports, workOrders } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireUser(["officer", "admin"]);
  if (error) return error;

  const healthRows = await db
    .select({ severity: drains.severity, count: sql<number>`count(*)` })
    .from(drains)
    .groupBy(drains.severity);
  const healthDistribution = { healthy: 0, warning: 0, "high-risk": 0, critical: 0 } as Record<string, number>;
  for (const r of healthRows) healthDistribution[r.severity] = Number(r.count);

  const wardRows = await db
    .select({ ward: sql<string>`coalesce(${reports.wardGuess}, 'Unknown')`, count: sql<number>`count(*)` })
    .from(reports)
    .groupBy(sql`coalesce(${reports.wardGuess}, 'Unknown')`)
    .orderBy(sql`count(*) desc`)
    .limit(8);

  const trendRows = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${reports.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)`,
    })
    .from(reports)
    .where(sql`${reports.createdAt} >= now() - interval '28 days'`)
    .groupBy(sql`date_trunc('week', ${reports.createdAt})`)
    .orderBy(sql`date_trunc('week', ${reports.createdAt})`);

  const [slaRow] = await db
    .select({
      total: sql<number>`count(*)`,
      withinSla: sql<number>`count(*) filter (where ${workOrders.resolvedAt} <= ${workOrders.slaDueAt})`,
    })
    .from(workOrders)
    .where(sql`${workOrders.status} in ('resolved', 'closed')`);

  const totalResolved = Number(slaRow?.total ?? 0);
  const withinSla = Number(slaRow?.withinSla ?? 0);
  const slaPerformance =
    totalResolved === 0
      ? { withinSla: 100, breached: 0 }
      : {
          withinSla: Math.round((withinSla / totalResolved) * 100),
          breached: Math.round(((totalResolved - withinSla) / totalResolved) * 100),
        };

  // Real-data AI insight cards.
  const insights: string[] = [];
  if (wardRows[0]) {
    insights.push(`${wardRows[0].ward} has the most reports (${wardRows[0].count}) of any ward tracked so far.`);
  } else {
    insights.push("No reports yet — insights will appear once citizens start reporting.");
  }
  const criticalCount = healthDistribution.critical;
  insights.push(
    criticalCount > 0
      ? `${criticalCount} drain${criticalCount === 1 ? "" : "s"} currently at critical severity and need immediate attention.`
      : "No drains are currently at critical severity."
  );

  return Response.json({
    healthDistribution,
    reportsByWard: wardRows.map((r) => ({ ward: r.ward, count: Number(r.count) })),
    blockageTrend: trendRows.map((r) => ({ week: r.week, count: Number(r.count) })),
    slaPerformance,
    insights,
  });
}
