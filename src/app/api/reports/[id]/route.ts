import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const rows = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  const r = rows[0];
  if (!r) return jsonError("Report not found.", 404);

  return Response.json({
    id: r.id,
    reporterId: r.reporterId,
    issue: r.issue,
    location: r.location,
    description: r.description,
    photoUrl: r.photoUrl,
    drainId: r.drainId,
    status: r.status,
    severity: r.aiSeverity,
    aiBlockage: r.aiBlockage,
    aiConfidence: r.aiConfidence,
    aiExplanation: r.aiExplanation,
    workOrderId: r.workOrderId,
    creditsAwarded: r.creditsAwarded,
    date: r.createdAt.getTime(),
  });
}
