import { getCurrentUser } from "@/lib/auth";
import { calculateLevel } from "@/lib/rewardConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      initial: user.initial,
      role: user.role,
      teamId: user.teamId,
      credits: user.credits,
      level: calculateLevel(user.credits).name,
      settings: user.settings,
    },
  });
}
