import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creditTransactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { actionMeta } from "@/lib/rewardConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const rows = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, user.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(50);

  return Response.json(
    rows.map((r) => {
      const meta = actionMeta[r.reason] ?? { label: r.reason, icon: "circle", color: "var(--color-primary)" };
      return {
        action: meta.label,
        pts: r.amount >= 0 ? `+${r.amount}` : `${r.amount}`,
        icon: meta.icon,
        color: meta.color,
        time: r.createdAt.getTime(),
      };
    })
  );
}
