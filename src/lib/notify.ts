import { db } from "@/db";
import { notifications, eventLog } from "@/db/schema";

type NotificationType =
  | "report_update"
  | "work_order"
  | "critical_drain"
  | "credit_earned"
  | "badge_unlocked"
  | "ai_alert";

export async function notify(
  userId: number,
  type: NotificationType,
  title: string,
  body: string,
  relatedType?: string,
  relatedId?: string
) {
  await db.insert(notifications).values({
    userId,
    type,
    title,
    body,
    relatedType: relatedType ?? null,
    relatedId: relatedId ?? null,
  });
}

export async function logEvent(
  actorId: number | null,
  entityType: string,
  entityId: string,
  action: string,
  metadata: Record<string, unknown> = {}
) {
  await db.insert(eventLog).values({ actorId, entityType, entityId, action, metadata });
}
