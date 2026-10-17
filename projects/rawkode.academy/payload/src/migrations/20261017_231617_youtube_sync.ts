import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'
import { youtubeTables } from '../youtube/store'

// Channels collection plus two plain tables the sync owns: sealed refresh
// tokens (never exposed through Payload) and per-channel sync state.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`channels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`privacy\` text DEFAULT 'public' NOT NULL,
  	\`connection\` text DEFAULT 'disconnected' NOT NULL,
  	\`youtube_channel_id\` text,
  	\`youtube_title\` text,
  	\`stream_id\` text,
  	\`connected_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`channels_youtube_channel_id_idx\` ON \`channels\` (\`youtube_channel_id\`);`)
  await db.run(sql`CREATE INDEX \`channels_updated_at_idx\` ON \`channels\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`channels_created_at_idx\` ON \`channels\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`videos_rels\` ADD \`channels_id\` integer REFERENCES channels(id);`)
  await db.run(sql`CREATE INDEX \`videos_rels_channels_id_idx\` ON \`videos_rels\` (\`channels_id\`);`)
  await db.run(sql`ALTER TABLE \`_videos_v_rels\` ADD \`channels_id\` integer REFERENCES channels(id);`)
  await db.run(sql`CREATE INDEX \`_videos_v_rels_channels_id_idx\` ON \`_videos_v_rels\` (\`channels_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`channels_id\` integer REFERENCES channels(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_channels_id_idx\` ON \`payload_locked_documents_rels\` (\`channels_id\`);`)
  for (const statement of youtubeTables) await db.run(sql.raw(statement))
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS youtube_sync;`)
  await db.run(sql`DROP TABLE IF EXISTS youtube_credentials;`)
  await db.run(sql`DROP TABLE \`channels\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_videos_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`technologies_id\` integer,
  	\`people_id\` integer,
  	\`chapters_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`videos\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`technologies_id\`) REFERENCES \`technologies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`people_id\`) REFERENCES \`people\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`chapters_id\`) REFERENCES \`chapters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_videos_rels\`("id", "order", "parent_id", "path", "technologies_id", "people_id", "chapters_id") SELECT "id", "order", "parent_id", "path", "technologies_id", "people_id", "chapters_id" FROM \`videos_rels\`;`)
  await db.run(sql`DROP TABLE \`videos_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_videos_rels\` RENAME TO \`videos_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`videos_rels_order_idx\` ON \`videos_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`videos_rels_parent_idx\` ON \`videos_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`videos_rels_path_idx\` ON \`videos_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`videos_rels_technologies_id_idx\` ON \`videos_rels\` (\`technologies_id\`);`)
  await db.run(sql`CREATE INDEX \`videos_rels_people_id_idx\` ON \`videos_rels\` (\`people_id\`);`)
  await db.run(sql`CREATE INDEX \`videos_rels_chapters_id_idx\` ON \`videos_rels\` (\`chapters_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__videos_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`technologies_id\` integer,
  	\`people_id\` integer,
  	\`chapters_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_videos_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`technologies_id\`) REFERENCES \`technologies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`people_id\`) REFERENCES \`people\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`chapters_id\`) REFERENCES \`chapters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__videos_v_rels\`("id", "order", "parent_id", "path", "technologies_id", "people_id", "chapters_id") SELECT "id", "order", "parent_id", "path", "technologies_id", "people_id", "chapters_id" FROM \`_videos_v_rels\`;`)
  await db.run(sql`DROP TABLE \`_videos_v_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new__videos_v_rels\` RENAME TO \`_videos_v_rels\`;`)
  await db.run(sql`CREATE INDEX \`_videos_v_rels_order_idx\` ON \`_videos_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_rels_parent_idx\` ON \`_videos_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_rels_path_idx\` ON \`_videos_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_rels_technologies_id_idx\` ON \`_videos_v_rels\` (\`technologies_id\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_rels_people_id_idx\` ON \`_videos_v_rels\` (\`people_id\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_rels_chapters_id_idx\` ON \`_videos_v_rels\` (\`chapters_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pipeline_runs_id\` integer,
  	\`users_id\` integer,
  	\`deletion_markers_id\` integer,
  	\`videos_id\` integer,
  	\`people_id\` integer,
  	\`technologies_id\` integer,
  	\`shows_id\` integer,
  	\`episodes_id\` integer,
  	\`chapters_id\` integer,
  	\`learning_resources_id\` integer,
  	\`articles_id\` integer,
  	\`courses_id\` integer,
  	\`course_modules_id\` integer,
  	\`learning_paths_id\` integer,
  	\`media_id\` integer,
  	\`series_id\` integer,
  	\`adrs_id\` integer,
  	\`testimonials_id\` integer,
  	\`news_id\` integer,
  	\`changelog_id\` integer,
  	\`static_assets_id\` integer,
  	\`seasons_id\` integer,
  	\`competitors_id\` integer,
  	\`brackets_id\` integer,
  	\`bracket_applications_id\` integer,
  	\`teams_id\` integer,
  	\`team_members_id\` integer,
  	\`team_invites_id\` integer,
  	\`bracket_breaks_id\` integer,
  	\`bracket_entries_id\` integer,
  	\`matches_id\` integer,
  	\`match_results_id\` integer,
  	\`registrations_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pipeline_runs_id\`) REFERENCES \`pipeline_runs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`deletion_markers_id\`) REFERENCES \`deletion_markers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`videos_id\`) REFERENCES \`videos\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`people_id\`) REFERENCES \`people\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`technologies_id\`) REFERENCES \`technologies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`shows_id\`) REFERENCES \`shows\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`episodes_id\`) REFERENCES \`episodes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`chapters_id\`) REFERENCES \`chapters\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`learning_resources_id\`) REFERENCES \`learning_resources\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`courses_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`course_modules_id\`) REFERENCES \`course_modules\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`learning_paths_id\`) REFERENCES \`learning_paths\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`series_id\`) REFERENCES \`series\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`adrs_id\`) REFERENCES \`adrs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`news_id\`) REFERENCES \`news\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`changelog_id\`) REFERENCES \`changelog\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`static_assets_id\`) REFERENCES \`static_assets\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`seasons_id\`) REFERENCES \`seasons\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`competitors_id\`) REFERENCES \`competitors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`brackets_id\`) REFERENCES \`brackets\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bracket_applications_id\`) REFERENCES \`bracket_applications\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`teams_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`team_members_id\`) REFERENCES \`team_members\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`team_invites_id\`) REFERENCES \`team_invites\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bracket_breaks_id\`) REFERENCES \`bracket_breaks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`bracket_entries_id\`) REFERENCES \`bracket_entries\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`matches_id\`) REFERENCES \`matches\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`match_results_id\`) REFERENCES \`match_results\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`registrations_id\`) REFERENCES \`registrations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pipeline_runs_id", "users_id", "deletion_markers_id", "videos_id", "people_id", "technologies_id", "shows_id", "episodes_id", "chapters_id", "learning_resources_id", "articles_id", "courses_id", "course_modules_id", "learning_paths_id", "media_id", "series_id", "adrs_id", "testimonials_id", "news_id", "changelog_id", "static_assets_id", "seasons_id", "competitors_id", "brackets_id", "bracket_applications_id", "teams_id", "team_members_id", "team_invites_id", "bracket_breaks_id", "bracket_entries_id", "matches_id", "match_results_id", "registrations_id") SELECT "id", "order", "parent_id", "path", "pipeline_runs_id", "users_id", "deletion_markers_id", "videos_id", "people_id", "technologies_id", "shows_id", "episodes_id", "chapters_id", "learning_resources_id", "articles_id", "courses_id", "course_modules_id", "learning_paths_id", "media_id", "series_id", "adrs_id", "testimonials_id", "news_id", "changelog_id", "static_assets_id", "seasons_id", "competitors_id", "brackets_id", "bracket_applications_id", "teams_id", "team_members_id", "team_invites_id", "bracket_breaks_id", "bracket_entries_id", "matches_id", "match_results_id", "registrations_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pipeline_runs_id_idx\` ON \`payload_locked_documents_rels\` (\`pipeline_runs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_deletion_markers_id_idx\` ON \`payload_locked_documents_rels\` (\`deletion_markers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_videos_id_idx\` ON \`payload_locked_documents_rels\` (\`videos_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_people_id_idx\` ON \`payload_locked_documents_rels\` (\`people_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_technologies_id_idx\` ON \`payload_locked_documents_rels\` (\`technologies_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_shows_id_idx\` ON \`payload_locked_documents_rels\` (\`shows_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_episodes_id_idx\` ON \`payload_locked_documents_rels\` (\`episodes_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_chapters_id_idx\` ON \`payload_locked_documents_rels\` (\`chapters_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_learning_resources_id_idx\` ON \`payload_locked_documents_rels\` (\`learning_resources_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_courses_id_idx\` ON \`payload_locked_documents_rels\` (\`courses_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_course_modules_id_idx\` ON \`payload_locked_documents_rels\` (\`course_modules_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_learning_paths_id_idx\` ON \`payload_locked_documents_rels\` (\`learning_paths_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_series_id_idx\` ON \`payload_locked_documents_rels\` (\`series_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_adrs_id_idx\` ON \`payload_locked_documents_rels\` (\`adrs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_testimonials_id_idx\` ON \`payload_locked_documents_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_news_id_idx\` ON \`payload_locked_documents_rels\` (\`news_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_changelog_id_idx\` ON \`payload_locked_documents_rels\` (\`changelog_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_static_assets_id_idx\` ON \`payload_locked_documents_rels\` (\`static_assets_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_seasons_id_idx\` ON \`payload_locked_documents_rels\` (\`seasons_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_competitors_id_idx\` ON \`payload_locked_documents_rels\` (\`competitors_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_brackets_id_idx\` ON \`payload_locked_documents_rels\` (\`brackets_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_bracket_applications_id_idx\` ON \`payload_locked_documents_rels\` (\`bracket_applications_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_teams_id_idx\` ON \`payload_locked_documents_rels\` (\`teams_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_team_members_id_idx\` ON \`payload_locked_documents_rels\` (\`team_members_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_team_invites_id_idx\` ON \`payload_locked_documents_rels\` (\`team_invites_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_bracket_breaks_id_idx\` ON \`payload_locked_documents_rels\` (\`bracket_breaks_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_bracket_entries_id_idx\` ON \`payload_locked_documents_rels\` (\`bracket_entries_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_matches_id_idx\` ON \`payload_locked_documents_rels\` (\`matches_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_match_results_id_idx\` ON \`payload_locked_documents_rels\` (\`match_results_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_registrations_id_idx\` ON \`payload_locked_documents_rels\` (\`registrations_id\`);`)
}
