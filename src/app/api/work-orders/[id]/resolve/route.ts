import { eq } from "drizzle-orm";
import { db } from "@/db";
import { drains, reports, workOrders } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";
import { savePhoto } from "@/lib/uploadPhoto";
import { analyzePhoto } from "@/lib/ai/vision";
import { recordCreditTransaction, finalizeCredits } from "@/lib/credits";
import { logEvent, notify } from "@/lib/notify";
import { actions as rewardActions } from "@/lib/rewardConfig";

export const dynamic = "force-dynamic";

function riskForSeverity(severity: string): "low" | "medium" | "high" {
  if (severity === "critical") return "high";
  if (severity === "high-risk") return "medium";
  return "low";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser(["worker", "officer", "admin"]);
  if (error) return error;

  const { id } = await params;
  const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
  if (!wo) return jsonError("Work order not found.", 404);

  if (user.role === "worker" && wo.teamId !== user.teamId) {
    return jsonError("This work order is not assigned to your team.", 403);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart form data.", 400);

  const beforePhoto = form.get("beforePhoto");
  const afterPhoto = form.get("afterPhoto");
  if (!(beforePhoto instanceof File) || beforePhoto.size === 0) return jsonError("Before photo is required.", 400);
  if (!(afterPhoto instanceof File) || afterPhoto.size === 0) return jsonError("After photo is required.", 400);

  const before = await savePhoto(beforePhoto);
  const after = await savePhoto(afterPhoto);
  const beforeAnalysis = await analyzePhoto(before.buffer);
  const afterAnalysis = await analyzePhoto(after.buffer);

  const improvementPct = Math.max(0, Math.round(beforeAnalysis.blockage - afterAnalysis.blockage));

  await db
    .update(workOrders)
    .set({
      status: "resolved",
      beforePhotoUrl: before.url,
      afterPhotoUrl: after.url,
      resolutionNotes: `Before: ${beforeAnalysis.blockage}% blocked. After: ${afterAnalysis.blockage}% blocked.`,
      improvementPct,
      resolvedAt: new Date(),
    })
    .where(eq(workOrders.id, id));

  await db
    .update(drains)
    .set({
      severity: afterAnalysis.severity,
      status: "Verified",
      risk: riskForSeverity(afterAnalysis.severity),
      waterLevel: afterAnalysis.waterLevel,
      blockage: afterAnalysis.blockage,
      lastInspectionAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(drains.id, wo.drainId));

  if (user.role === "worker") {
    const amount = rewardActions.resolutionFeedback + rewardActions.cleanupParticipation;
    await recordCreditTransaction(user.id, amount, "cleanupParticipation", { relatedWorkOrderId: id });
    await notify(user.id, "credit_earned", `+${amount} Civic Credits`, "Earned for resolving a work order.");
    await finalizeCredits(user.id);
  }

  if (wo.reportId) {
    const [report] = await db.select().from(reports).where(eq(reports.id, wo.reportId)).limit(1);
    if (report) {
      await notify(
        report.reporterId,
        "work_order",
        "Your report has been resolved",
        `The issue you reported has been cleared. Blockage reduced by ${improvementPct}%.`,
        "work_order",
        id
      );
    }
  }

  await logEvent(user.id, "work_order", id, "resolved", { improvementPct });

  return Response.json({
    workOrderId: id,
    before: { blockage: beforeAnalysis.blockage, waterLevel: beforeAnalysis.waterLevel },
    after: { blockage: afterAnalysis.blockage, waterLevel: afterAnalysis.waterLevel },
    improvementPct,
  });
}
