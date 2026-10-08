import {
  pgTable,
  pgEnum,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["citizen", "worker", "officer", "admin"]);
export const severityEnum = pgEnum("severity", ["healthy", "warning", "high-risk", "critical"]);
export const drainTypeEnum = pgEnum("drain_type", ["Storm Water", "Sewer", "Mixed"]);
export const riskEnum = pgEnum("risk", ["low", "medium", "high"]);
export const drainStatusEnum = pgEnum("drain_status", ["Reported", "Verified"]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending_ai",
  "verified",
  "needs_review",
  "duplicate",
  "invalid",
]);

export const workOrderStatusEnum = pgEnum("work_order_status", [
  "reported",
  "verified",
  "assigned",
  "in_progress",
  "resolved",
  "verification_pending",
  "closed",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "report_update",
  "work_order",
  "critical_drain",
  "credit_earned",
  "badge_unlocked",
  "ai_alert",
]);

export const badgeTypeEnum = pgEnum("badge_type", [
  "reports",
  "accuracy",
  "ward-reports",
  "credits",
  "seasonal",
]);

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ward: text("ward"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  initial: text("initial").notNull(),
  role: roleEnum("role").notNull().default("citizen"),
  teamId: integer("team_id").references(() => teams.id),
  credits: integer("credits").notNull().default(0),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const drains = pgTable("drains", {
  id: text("id").primaryKey(),
  ward: text("ward").notNull(),
  location: text("location").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  severity: severityEnum("severity").notNull().default("healthy"),
  type: drainTypeEnum("type").notNull().default("Storm Water"),
  status: drainStatusEnum("status").notNull().default("Reported"),
  risk: riskEnum("risk").notNull().default("low"),
  waterLevel: integer("water_level").notNull().default(0),
  blockage: integer("blockage").notNull().default(0),
  assignedTeamId: integer("assigned_team_id").references(() => teams.id),
  lastInspectionAt: timestamp("last_inspection_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workOrders = pgTable("work_orders", {
  id: text("id").primaryKey(),
  drainId: text("drain_id")
    .notNull()
    .references(() => drains.id),
  reportId: text("report_id"),
  teamId: integer("team_id").references(() => teams.id),
  severity: severityEnum("severity").notNull(),
  status: workOrderStatusEnum("status").notNull().default("reported"),
  slaDueAt: timestamp("sla_due_at").notNull(),
  description: text("description").notNull().default(""),
  beforePhotoUrl: text("before_photo_url"),
  afterPhotoUrl: text("after_photo_url"),
  resolutionNotes: text("resolution_notes"),
  improvementPct: integer("improvement_pct"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  assignedAt: timestamp("assigned_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporterId: integer("reporter_id")
    .notNull()
    .references(() => users.id),
  issue: text("issue").notNull(),
  location: text("location").notNull().default(""),
  description: text("description").notNull().default(""),
  photoUrl: text("photo_url").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  wardGuess: text("ward_guess"),
  drainId: text("drain_id").references(() => drains.id),
  status: reportStatusEnum("status").notNull().default("pending_ai"),
  aiSeverity: severityEnum("ai_severity"),
  aiBlockage: integer("ai_blockage"),
  aiConfidence: integer("ai_confidence"),
  aiExplanation: jsonb("ai_explanation").notNull().default([]),
  workOrderId: text("work_order_id").references(() => workOrders.id),
  creditsAwarded: integer("credits_awarded").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inspections = pgTable("inspections", {
  id: text("id").primaryKey(),
  drainId: text("drain_id").references(() => drains.id),
  workOrderId: text("work_order_id").references(() => workOrders.id),
  performedBy: integer("performed_by").references(() => users.id),
  photoUrl: text("photo_url").notNull(),
  aiBlockage: integer("ai_blockage").notNull(),
  aiWaterLevel: integer("ai_water_level").notNull(),
  aiDebris: boolean("ai_debris").notNull(),
  aiVegetation: text("ai_vegetation").notNull(),
  aiRiskScore: integer("ai_risk_score").notNull(),
  aiSeverity: severityEnum("ai_severity").notNull(),
  aiConfidence: integer("ai_confidence").notNull(),
  aiExplanation: jsonb("ai_explanation").notNull().default([]),
  recommendation: text("recommendation").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  relatedReportId: text("related_report_id"),
  relatedWorkOrderId: text("related_work_order_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const badgeDefinitions = pgTable("badge_definitions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  desc: text("desc").notNull(),
  threshold: integer("threshold").notNull(),
  type: badgeTypeEnum("type").notNull(),
});

export const userBadges = pgTable("user_badges", {
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id")
    .notNull()
    .references(() => badgeDefinitions.id),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eventLog = pgTable("event_log", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
