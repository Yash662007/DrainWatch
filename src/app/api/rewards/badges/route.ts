import { requireUser } from "@/lib/auth";
import { getBadgeProgress } from "@/lib/badges";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  return Response.json(await getBadgeProgress(user.id));
}
