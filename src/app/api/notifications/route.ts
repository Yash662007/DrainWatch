import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return Response.json(
    rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      desc: n.body,
      unread: !n.read,
      time: n.createdAt.getTime(),
      relatedType: n.relatedType,
      relatedId: n.relatedId,
    }))
  );
}
