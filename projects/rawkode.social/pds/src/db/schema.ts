import { sql } from "drizzle-orm";
import {
  blob,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

export const userAccount = sqliteTable(
  "user_account",
  {
    did: text("did").primaryKey(),
    handle: text("handle").notNull().unique()
  }
);

export const repoHead = sqliteTable(
  "repo_head",
  {
    did: text("did").primaryKey(),
    rootCid: text("root_cid").notNull(),
    rev: text("rev").notNull(),
    updatedAt: integer("updated_at", { mode: "number" })
      .notNull()
      .default(sql`(strftime('%s','now') * 1000)`) 
  }
);

export const repoCommits = sqliteTable(
  "repo_commits",
  {
    seq: integer("seq", { mode: "number" }),
    did: text("did"),
    cid: text("cid").primaryKey(),
    rev: text("rev").notNull(),
    since: text("since"),
    prev: text("prev"),
    eventTime: text("event_time"),
    car: blob("car"),
    frame: blob("frame"),
    tooBig: integer("too_big", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "number" })
      .notNull()
      .default(sql`(strftime('%s','now') * 1000)`)
  },
  (table) => ({
    seqIdx: uniqueIndex("repo_commits_seq_idx").on(table.seq),
    revIdx: index("repo_commits_rev_idx").on(table.rev)
  })
);

export const repoBlocks = sqliteTable(
  "repo_blocks",
  {
    cid: text("cid").primaryKey(),
    rev: text("rev").notNull(),
    data: blob("data").notNull()
  }
);

export const recordsIndex = sqliteTable(
  "records_index",
  {
    uri: text("uri").primaryKey(),
    did: text("did").notNull(),
    collection: text("collection").notNull(),
    rkey: text("rkey").notNull(),
    cid: text("cid").notNull(),
    indexedAt: integer("indexed_at", { mode: "number" })
      .notNull()
      .default(sql`(strftime('%s','now') * 1000)`)
  },
  (table) => ({
    lookupIdx: index("records_lookup_idx").on(
      table.did,
      table.collection,
      table.rkey
    ),
    uniqueCollection: uniqueIndex("records_unique_collection_idx").on(
      table.did,
      table.collection,
      table.rkey
    )
  })
);

export type UserAccount = typeof userAccount.$inferSelect;
export type RepoHead = typeof repoHead.$inferSelect;
export type RepoCommit = typeof repoCommits.$inferSelect;
export type RepoBlock = typeof repoBlocks.$inferSelect;
export type RecordIndex = typeof recordsIndex.$inferSelect;
