import { eq } from "drizzle-orm";
import { db } from "@/db";
import { drains, inspections } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";
import { savePhoto } from "@/lib/uploadPhoto";
import { analyzePhoto } from "@/lib/ai/vision";
import { generateId } from "@/lib/ids";
import { logEvent } from "@/lib/notify";

export const dynamic = "force-dynamic";

function riskForSeverity(severity: string): "low" | "medium" | "high" {
  if (severity === "critical") return "high";
  if (severity === "high-risk") return "medium";
  return "low";
}

export async function POST(request: Request) {
  const { user, error } = await requireUser(["officer", "admin"]);
  if (error) return error;

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart form data.", 400);

  const drainId = form.get("drainId");
  const photo = form.get("photo");

  if (!drainId || typeof drainId !== "string") return jsonError("A drain must be selected.", 400);
  if (!(photo instanceof File) || photo.size === 0) return jsonError("A photo is required.", 400);

  const [drain] = await db.select().from(drains).where(eq(drains.id, drainId)).limit(1);
  if (!drain) return jsonError("Drain not found.", 404);

  const { url: photoUrl, buffer } = await savePhoto(photo);
  const ai = await analyzePhoto(buffer);

  const inspectionId = generateId("INSP");
  await db.insert(inspections).values({
    id: inspectionId,
    drainId,
    performedBy: user.id,
    photoUrl,
    aiBlockage: ai.blockage,
    aiWaterLevel: ai.waterLevel,
    aiDebris: ai.debris,
    aiVegetation: ai.vegetation,
    aiRiskScore: ai.riskScore,
    aiSeverity: ai.severity,
    aiConfidence: ai.confidence,
    aiExplanation: ai.explanation,
    recommendation: ai.recommendation,
  });

  await db
    .update(drains)
    .set({
      severity: ai.severity,
      risk: riskForSeverity(ai.severity),
      waterLevel: ai.waterLevel,
      blockage: ai.blockage,
      lastInspectionAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(drains.id, drainId));

  await logEvent(user.id, "inspection", inspectionId, "created", { drainId, severity: ai.severity });

  return Response.json({
    inspectionId,
    drainId,
    photoUrl,
    blockage: ai.blockage,
    waterLevel: ai.waterLevel,
    debris: ai.debris,
    vegetation: ai.vegetation,
    riskScore: ai.riskScore,
    severity: ai.severity,
    confidence: ai.confidence,
    explanation: ai.explanation,
    recommendation: ai.recommendation,
  });
}
