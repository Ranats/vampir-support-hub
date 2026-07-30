CREATE TABLE `clan_portal_creation_limits` (
	`rate_key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`window_started_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clan_portals` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`schedule_json` text NOT NULL,
	`view_token_hash` text NOT NULL,
	`admin_token_hash` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clan_portals_view_token_hash_unique` ON `clan_portals` (`view_token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `clan_portals_admin_token_hash_unique` ON `clan_portals` (`admin_token_hash`);