CREATE TABLE IF NOT EXISTS "user_account" (
"did" text PRIMARY KEY NOT NULL,
"handle" text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "repo_head" (
"did" text PRIMARY KEY NOT NULL,
"root_cid" text NOT NULL,
"rev" text NOT NULL,
"updated_at" integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);

CREATE TABLE IF NOT EXISTS "repo_commits" (
"cid" text PRIMARY KEY NOT NULL,
"rev" text NOT NULL,
"since" text,
"prev" text,
"created_at" integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);

CREATE TABLE IF NOT EXISTS "repo_blocks" (
"cid" text PRIMARY KEY NOT NULL,
"rev" text NOT NULL,
"data" blob NOT NULL
);

CREATE TABLE IF NOT EXISTS "records_index" (
"uri" text PRIMARY KEY NOT NULL,
"did" text NOT NULL,
"collection" text NOT NULL,
"rkey" text NOT NULL,
"cid" text NOT NULL,
"indexed_at" integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);

CREATE INDEX IF NOT EXISTS "records_lookup_idx" ON "records_index" ("did","collection","rkey");
CREATE UNIQUE INDEX IF NOT EXISTS "records_unique_collection_idx" ON "records_index" ("did","collection","rkey");
