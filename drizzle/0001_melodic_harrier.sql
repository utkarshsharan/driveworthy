CREATE TABLE `analytics_daily` (
	`day` text NOT NULL,
	`event_name` text NOT NULL,
	`context` text DEFAULT '' NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analytics_daily_event_context_unique` ON `analytics_daily` (`day`,`event_name`,`context`);