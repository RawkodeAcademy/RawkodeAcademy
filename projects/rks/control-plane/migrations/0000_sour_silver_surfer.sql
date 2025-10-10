CREATE TABLE `iso_manifests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`show_id` text NOT NULL,
	`kind` text NOT NULL,
	`r2_key` text NOT NULL,
	`status` text NOT NULL,
	`total_bytes` integer DEFAULT 0 NOT NULL,
	`total_parts` integer DEFAULT 0 NOT NULL,
	`hash` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `iso_parts` (
	`id` text PRIMARY KEY NOT NULL,
	`manifest_id` text NOT NULL,
	`part_no` integer NOT NULL,
	`bytes` integer NOT NULL,
	`hash` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `poll_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`voter_key` text NOT NULL,
	`option_idx` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `polls` (
	`id` text PRIMARY KEY NOT NULL,
	`show_id` text NOT NULL,
	`question` text NOT NULL,
	`options_json` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `raise_hands` (
	`id` text PRIMARY KEY NOT NULL,
	`show_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`show_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rtk_session_id` text NOT NULL,
	`created_at` text NOT NULL,
	`ended_at` text
);
--> statement-breakpoint
CREATE TABLE `shows` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`starts_at` text NOT NULL,
	`description` text,
	`created_by` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`atproto_did` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL
);

