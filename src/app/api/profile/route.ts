import { eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const [reportStats] = await db
    .select({
      total: sql<number>`count(*)`,
      verified: sql<number>`count(*) filter (where ${reports.status} = 'verified')`,
    })
    .from(reports)
    .where(eq(reports.reporterId, user.id));

  const total = Number(reportStats?.total ?? 0);
  const verified = Number(reportStats?.verified ?? 0);
  const verifiedAccuracy = total === 0 ? 0 : Math.round((verified / total) * 100);

  const [rankRow] = await db
    .select({ higherCount: sql<number>`count(*)` })
    .from(users)
    .where(gt(users.credits, user.credits));

  return Response.json({
    reportsSubmitted: total,
    verifiedAccuracy,
    communityRank: Number(rankRow?.higherCount ?? 0) + 1,
  });
}
