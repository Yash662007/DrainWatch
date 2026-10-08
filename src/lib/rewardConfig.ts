// Server-side mirror of js/data/reward-config.js — keep these two in sync.
// The frontend file remains the source of truth for display copy; this file
// is what the backend actually uses to award credits and evaluate badges.

export const actions = {
  verifiedReport: 25,
  photoEvidence: 10,
  accurateLocation: 5,
  confirmValidIssue: 10,
  resolutionFeedback: 15,
  cleanupParticipation: 30,
  invalidReport: -20,
} as const;

export const levels = [
  { name: "Citizen", min: 0, max: 99 },
  { name: "Community Helper", min: 100, max: 299 },
  { name: "Civic Contributor", min: 300, max: 599 },
  { name: "Community Guardian", min: 600, max: 999 },
  { name: "Civic Champion", min: 1000, max: 1999 },
  { name: "Waste Warrior", min: 2000, max: Infinity },
] as const;

export function calculateLevel(credits: number) {
  return levels.find((l) => credits >= l.min && credits <= l.max) ?? levels[0];
}

export const actionMeta: Record<string, { label: string; icon: string; color: string }> = {
  verifiedReport: { label: "Verified Report", icon: "check-circle", color: "var(--color-healthy)" },
  photoEvidence: { label: "Photo Evidence", icon: "camera", color: "var(--color-primary)" },
  accurateLocation: { label: "Accurate Location", icon: "map-pin", color: "var(--color-primary)" },
  confirmValidIssue: { label: "Confirmed Valid Issue", icon: "check", color: "var(--color-primary)" },
  resolutionFeedback: { label: "Resolution Feedback", icon: "message-square", color: "var(--color-primary)" },
  cleanupParticipation: { label: "Cleanup Participation", icon: "hard-hat", color: "var(--color-primary)" },
  invalidReport: { label: "Invalid Report", icon: "alert-triangle", color: "var(--color-critical)" },
};

export const badgeDefinitions = [
  {
    id: "first-reporter",
    name: "First Reporter",
    icon: "flag",
    desc: "Submit your first valid report",
    threshold: 1,
    type: "reports" as const,
  },
  {
    id: "verified-eye",
    name: "Verified Eye",
    icon: "eye",
    desc: "Maintain 90% report accuracy",
    threshold: 90,
    type: "accuracy" as const,
  },
  {
    id: "local-watcher",
    name: "Local Watcher",
    icon: "map-pin",
    desc: "Report 5 issues in one ward",
    threshold: 5,
    type: "ward-reports" as const,
  },
  {
    id: "community-helper",
    name: "Community Helper",
    icon: "users",
    desc: "Earn 300 Civic Credits",
    threshold: 300,
    type: "credits" as const,
  },
  {
    id: "monsoon-guardian",
    name: "Monsoon Guardian",
    icon: "cloud-rain",
    desc: "Active reporting during monsoon season",
    threshold: 1,
    type: "seasonal" as const,
  },
  {
    id: "civic-champion",
    name: "Civic Champion",
    icon: "award",
    desc: "Reach Civic Champion level",
    threshold: 1000,
    type: "credits" as const,
  },
] as const;
