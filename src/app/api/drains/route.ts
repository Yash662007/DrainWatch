import { db } from "@/db";
import { drains } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { mapDrain } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const rows = await db.select().from(drains);
  return Response.json(rows.map(mapDrain));
}
