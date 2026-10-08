import { createHash } from "crypto";

export type VegetationLevel = "none" | "light" | "moderate" | "heavy";
export type Severity = "healthy" | "warning" | "high-risk" | "critical";

export interface VisionResult {
  blockage: number; // 0-100
  waterLevel: number; // 0-100
  debris: boolean;
  vegetation: VegetationLevel;
  riskScore: number; // 0-100
  severity: Severity;
  confidence: number; // 0-100
  explanation: string[];
  recommendation: string;
}

// Deterministic fallback: hash the photo bytes so the same photo always
// produces the same analysis, instead of Math.random() theater. Swap in a
// real provider below once AI_VISION_PROVIDER / AI_VISION_API_KEY are set.
function deterministicAnalysis(photoBuffer: Buffer): VisionResult {
  const hash = createHash("sha256").update(photoBuffer).digest();
  const byte = (i: number) => hash[i % hash.length];

  const blockage = byte(0) % 101;
  const waterLevel = byte(1) % 101;
  const debris = byte(2) % 2 === 0;
  const vegetationLevels: VegetationLevel[] = ["none", "light", "moderate", "heavy"];
  const vegetation = vegetationLevels[byte(3) % vegetationLevels.length];
  const confidence = 65 + (byte(4) % 33); // 65-97

  const vegetationScore = { none: 0, light: 10, moderate: 20, heavy: 30 }[vegetation];
  const riskScore = Math.min(
    100,
    Math.round(blockage * 0.5 + waterLevel * 0.3 + (debris ? 15 : 0) + vegetationScore * 0.2)
  );

  let severity: Severity;
  if (riskScore >= 80) severity = "critical";
  else if (riskScore >= 55) severity = "high-risk";
  else if (riskScore >= 30) severity = "warning";
  else severity = "healthy";

  const explanation: string[] = [];
  if (blockage > 60) explanation.push("Heavy debris detected obstructing flow");
  if (waterLevel > 70) explanation.push("Water level elevated near critical overflow margin");
  if (debris) explanation.push("Solid waste accumulation visible in frame");
  if (vegetation === "moderate" || vegetation === "heavy") {
    explanation.push("Vegetation overgrowth contributing to blockage");
  }
  if (explanation.length === 0) explanation.push("No significant obstruction detected");

  const recommendation =
    severity === "critical" || severity === "high-risk"
      ? "Immediate mechanical cleaning recommended to prevent flooding."
      : severity === "warning"
        ? "Schedule cleaning within the next maintenance cycle."
        : "No action required at this time.";

  return { blockage, waterLevel, debris, vegetation, riskScore, severity, confidence, explanation, recommendation };
}

async function callConfiguredProvider(_photoBuffer: Buffer): Promise<VisionResult> {
  // Not implemented yet — no AI_VISION_API_KEY has been provided.
  // When one is added, branch on process.env.AI_VISION_PROVIDER here
  // (e.g. "anthropic" | "openai") and return a VisionResult shaped
  // identically to deterministicAnalysis's output.
  throw new Error("AI_VISION_PROVIDER is configured but not implemented.");
}

export async function analyzePhoto(photoBuffer: Buffer): Promise<VisionResult> {
  if (process.env.AI_VISION_PROVIDER && process.env.AI_VISION_API_KEY) {
    return callConfiguredProvider(photoBuffer);
  }
  return deterministicAnalysis(photoBuffer);
}
