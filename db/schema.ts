import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const clanPortals = sqliteTable("clan_portals", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  scheduleJson: text("schedule_json").notNull(),
  viewTokenHash: text("view_token_hash").notNull().unique(),
  adminTokenHash: text("admin_token_hash").notNull().unique(),
  revision: integer("revision").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const clanPortalCreationLimits = sqliteTable("clan_portal_creation_limits", {
  rateKey: text("rate_key").primaryKey(),
  count: integer("count").notNull().default(1),
  windowStartedAt: text("window_started_at").notNull(),
});
