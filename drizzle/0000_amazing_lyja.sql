CREATE TABLE `import_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`status` text NOT NULL,
	`pages_read` integer DEFAULT 0 NOT NULL,
	`listings_seen` integer DEFAULT 0 NOT NULL,
	`duplicate_groups` integer DEFAULT 0 NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`message` text,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `listing_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`source_id` text NOT NULL,
	`source_listing_id` text NOT NULL,
	`source_url` text NOT NULL,
	`asking_price_lakh` real NOT NULL,
	`seen_at` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listing_sources_source_listing_unique` ON `listing_sources` (`source_id`,`source_listing_id`);--> statement-breakpoint
CREATE INDEX `listing_sources_listing_idx` ON `listing_sources` (`listing_id`);--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`fingerprint` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`variant` text DEFAULT '' NOT NULL,
	`year` integer NOT NULL,
	`kilometres` integer NOT NULL,
	`fuel` text DEFAULT '' NOT NULL,
	`transmission` text DEFAULT '' NOT NULL,
	`price_lakh` real NOT NULL,
	`image_url` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`first_seen_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listings_fingerprint_unique` ON `listings` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `listings_status_last_seen_idx` ON `listings` (`status`,`last_seen_at`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`inventory_url` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`last_completed_at` text
);
