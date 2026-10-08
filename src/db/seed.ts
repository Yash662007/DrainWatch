import "dotenv/config";
import { db, pool } from "./index";
import { badgeDefinitions, drains, teams, users } from "./schema";
import { hashPassword } from "../lib/auth";
import { badgeDefinitions as rewardBadges } from "../lib/rewardConfig";

const WARDS = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5", "Ward 6", "Ward 7", "Ward 8"];
const SEVERITIES = ["healthy", "warning", "high-risk", "critical"] as const;
const TYPES = ["Storm Water", "Sewer", "Mixed"] as const;

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

async function main() {
  console.log("Seeding teams...");
  const insertedTeams = await db
    .insert(teams)
    .values([
      { name: "Team Alpha", ward: "Ward 1" },
      { name: "Team Bravo", ward: "Ward 5" },
    ])
    .onConflictDoNothing()
    .returning();

  const teamAlpha = insertedTeams[0] ?? (await db.select().from(teams).limit(1))[0];

  console.log("Seeding demo users (one per role)...");
  const demoUsers = [
    { email: "citizen@drainwatch.demo", name: "Jane Doe", role: "citizen" as const, credits: 250 },
    { email: "worker@drainwatch.demo", name: "Ravi Kumar", role: "worker" as const, credits: 120, teamId: teamAlpha?.id },
    { email: "officer@drainwatch.demo", name: "Priya Shah", role: "officer" as const, credits: 0 },
    { email: "admin@drainwatch.demo", name: "Admin User", role: "admin" as const, credits: 0 },
  ];

  for (const u of demoUsers) {
    await db
      .insert(users)
      .values({
        email: u.email,
        passwordHash: hashPassword("password123"),
        name: u.name,
        initial: u.name
          .split(" ")
          .map((p) => p[0])
          .join("")
          .toUpperCase(),
        role: u.role,
        teamId: u.teamId ?? null,
        credits: u.credits,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding drains...");
  const rand = seededRandom(42);
  const drainRows = Array.from({ length: 30 }).map((_, i) => {
    const sev = SEVERITIES[Math.floor(rand() * SEVERITIES.length)];
    return {
      id: `DR-${1040 + i}`,
      ward: WARDS[i % 8],
      location: `Street ${i + 1}, ${WARDS[i % 8]}`,
      lat: 19.076 + (rand() * 0.1 - 0.05),
      lng: 72.8777 + (rand() * 0.1 - 0.05),
      severity: sev,
      type: TYPES[i % 3],
      status: sev === "healthy" ? ("Verified" as const) : ("Reported" as const),
      risk: sev === "critical" ? ("high" as const) : sev === "high-risk" ? ("medium" as const) : ("low" as const),
      waterLevel: Math.floor(rand() * 100),
      blockage: Math.floor(rand() * 100),
      lastInspectionAt: new Date(Date.now() - rand() * 86400000 * 7),
    };
  });
  await db.insert(drains).values(drainRows).onConflictDoNothing();

  console.log("Seeding badge definitions...");
  await db
    .insert(badgeDefinitions)
    .values(rewardBadges.map((b) => ({ ...b })))
    .onConflictDoNothing();

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
