import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { drains, reports } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";
import { savePhoto } from "@/lib/uploadPhoto";
import { analyzePhoto } from "@/lib/ai/vision";
import { DRAIN_MATCH_RADIUS_METERS, DUPLICATE_RADIUS_METERS, haversineMeters } from "@/lib/geo";
import { generateId } from "@/lib/ids";
import { recordCreditTransaction, finalizeCredits } from "@/lib/credits";
import { notify, logEvent } from "@/lib/notify";
import { actions as rewardActions } from "@/lib/rewardConfig";
import { SLA_HOURS_BY_SEVERITY } from "@/lib/workOrderFormat";
import { workOrders } from "@/db/schema";

export const dynamic = "force-dynamic";

function mapReport(r: typeof reports.$inferSelect) {
  return {
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
  };
}

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const rows = await db.select().from(reports).orderBy(desc(reports.createdAt));
  return Response.json(rows.map(mapReport));
}

function wardFromLabel(label: string): string | null {
  const match = label.match(/Ward\s*\d+/i);
  return match ? match[0].replace(/\s+/, " ") : null;
}

function riskForSeverity(severity: string): "low" | "medium" | "high" {
  if (severity === "critical") return "high";
  if (severity === "high-risk") return "medium";
  return "low";
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart form data.", 400);

  const issue = form.get("issue");
  const location = form.get("location");
  const description = (form.get("description") as string) || "";
  const latRaw = form.get("lat");
  const lngRaw = form.get("lng");
  const photo = form.get("photo");

  if (!issue || typeof issue !== "string") return jsonError("Issue type is required.", 400);
  if (!location || typeof location !== "string") return jsonError("Location is required.", 400);
  if (!(photo instanceof File) || photo.size === 0) return jsonError("A photo is required for AI verification.", 400);

  const lat = latRaw ? parseFloat(latRaw as string) : null;
  const lng = lngRaw ? parseFloat(lngRaw as string) : null;
  const hasCoords = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const { url: photoUrl, buffer } = await savePhoto(photo);
  const ai = await analyzePhoto(buffer);

  // Duplicate check: same issue type reported within the last 7 days near this location.
  let isDuplicate = false;
  if (hasCoords) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const recentSameIssue = await db
      .select({ lat: reports.lat, lng: reports.lng })
      .from(reports)
      .where(and(eq(reports.issue, issue), gte(reports.createdAt, sevenDaysAgo)));
    isDuplicate = recentSameIssue.some(
      (r) => r.lat !== null && r.lng !== null && haversineMeters(lat!, lng!, r.lat, r.lng) <= DUPLICATE_RADIUS_METERS
    );
  }

  const looksEmpty = ai.blockage < 15 && ai.waterLevel < 15 && !ai.debris && ai.vegetation === "none";

  let status: "verified" | "needs_review" | "duplicate" | "invalid";
  if (isDuplicate) status = "duplicate";
  else if (looksEmpty) status = "invalid";
  else if (ai.confidence < 75) status = "needs_review";
  else status = "verified";

  // Match or create a drain for verified/needs_review reports with coordinates.
  let drainId: string | null = null;
  const wardGuess = wardFromLabel(location);

  if (hasCoords && status !== "duplicate" && status !== "invalid") {
    const allDrains = await db.select().from(drains);
    let nearest: { id: string; dist: number } | null = null;
    for (const d of allDrains) {
      const dist = haversineMeters(lat!, lng!, d.lat, d.lng);
      if (dist <= DRAIN_MATCH_RADIUS_METERS && (!nearest || dist < nearest.dist)) {
        nearest = { id: d.id, dist };
      }
    }

    if (nearest) {
      drainId = nearest.id;
      await db
        .update(drains)
        .set({
          severity: ai.severity,
          status: "Reported",
          risk: riskForSeverity(ai.severity),
          waterLevel: ai.waterLevel,
          blockage: ai.blockage,
          lastInspectionAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(drains.id, nearest.id));
    } else {
      const newDrainId = generateId("DR");
      await db.insert(drains).values({
        id: newDrainId,
        ward: wardGuess || "Unassigned",
        location,
        lat: lat!,
        lng: lng!,
        severity: ai.severity,
        type: "Storm Water",
        status: "Reported",
        risk: riskForSeverity(ai.severity),
        waterLevel: ai.waterLevel,
        blockage: ai.blockage,
        lastInspectionAt: new Date(),
      });
      drainId = newDrainId;
    }
  }

  const reportId = generateId("REP");
  let creditsAwarded = 0;
  let workOrderId: string | null = null;

  if (status === "verified") {
    creditsAwarded += rewardActions.verifiedReport;
    creditsAwarded += rewardActions.photoEvidence;
    if (hasCoords) creditsAwarded += rewardActions.accurateLocation;
  } else if (status === "invalid") {
    creditsAwarded = rewardActions.invalidReport;
  }

  // Auto-create a work order for severe, verified reports.
  if (status === "verified" && drainId && (ai.severity === "critical" || ai.severity === "high-risk")) {
    workOrderId = generateId("WO");
    const slaHours = SLA_HOURS_BY_SEVERITY[ai.severity] ?? 24;
    await db.insert(workOrders).values({
      id: workOrderId,
      drainId,
      reportId,
      severity: ai.severity,
      status: "reported",
      slaDueAt: new Date(Date.now() + slaHours * 3600000),
      description: `AI-generated from citizen report: ${ai.recommendation}`,
    });
  }

  await db.insert(reports).values({
    id: reportId,
    reporterId: user.id,
    issue,
    location,
    description,
    photoUrl,
    lat,
    lng,
    wardGuess,
    drainId,
    status,
    aiSeverity: ai.severity,
    aiBlockage: ai.blockage,
    aiConfidence: ai.confidence,
    aiExplanation: ai.explanation,
    workOrderId,
    creditsAwarded,
  });

  if (creditsAwarded !== 0) {
    await recordCreditTransaction(user.id, creditsAwarded, status === "invalid" ? "invalidReport" : "verifiedReport", {
      relatedReportId: reportId,
    });
  }
  await finalizeCredits(user.id);

  const outcomeMessages: Record<string, { title: string; body: string }> = {
    verified: { title: "Report verified!", body: `Thank you for your civic contribution. +${creditsAwarded} Civic Credits earned.` },
    needs_review: { title: "Report pending review", body: "Your report needs officer review before it can be verified." },
    duplicate: { title: "Duplicate report", body: "A similar issue was recently reported nearby. You've been added as a follower." },
    invalid: { title: "Unable to verify", body: "The provided photo did not clearly show an issue. Please try again with a clearer photo." },
  };
  const msg = outcomeMessages[status];
  await notify(user.id, status === "verified" ? "credit_earned" : "report_update", msg.title, msg.body, "report", reportId);
  await logEvent(user.id, "report", reportId, "created", { status, severity: ai.severity });

  const rows = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);

  return Response.json({
    report: mapReport(rows[0]),
    outcome: status,
    creditsAwarded,
    workOrderId,
  });
}
