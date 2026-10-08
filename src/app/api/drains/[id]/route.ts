import { eq } from "drizzle-orm";
import { db } from "@/db";
import { drains } from "@/db/schema";
import { jsonError, requireUser } from "@/lib/auth";
import { mapDrain } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const rows = await db.select().from(drains).where(eq(drains.id, id)).limit(1);
  if (!rows[0]) return jsonError("Drain not found.", 404);

  return Response.json(mapDrain(rows[0]));
}
