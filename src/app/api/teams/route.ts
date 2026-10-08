import { db } from "@/db";
import { teams } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const rows = await db.select().from(teams);
  return Response.json(rows);
}
