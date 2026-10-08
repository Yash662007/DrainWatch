import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { creditTransactions, users } from "@/db/schema";
import { evaluateBadges } from "@/lib/badges";

export async function recordCreditTransaction(
  userId: number,
  amount: number,
  reason: string,
  opts: { relatedReportId?: string; relatedWorkOrderId?: string } = {}
) {
  await db.insert(creditTransactions).values({
    userId,
    amount,
    reason,
    relatedReportId: opts.relatedReportId ?? null,
    relatedWorkOrderId: opts.relatedWorkOrderId ?? null,
  });

  const [updated] = await db
    .update(users)
    .set({ credits: sql`greatest(0, ${users.credits} + ${amount})` })
    .where(eq(users.id, userId))
    .returning({ credits: users.credits });

  return updated?.credits ?? 0;
}

export async function finalizeCredits(userId: number) {
  await evaluateBadges(userId);
}
