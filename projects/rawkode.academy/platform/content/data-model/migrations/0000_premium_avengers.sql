CREATE TABLE `content` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`publishedAt` integer NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`description` text NOT NULL
);
