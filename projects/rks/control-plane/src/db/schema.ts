import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  atprotoDid: text('atproto_did').notNull(),
  role: text('role').notNull(),
  createdAt: text('created_at').notNull(),
})

export const shows = sqliteTable('shows', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  startsAt: text('starts_at').notNull(),
  description: text('description'),
  createdBy: text('created_by').notNull(),
  status: text('status').notNull(),
})

export const polls = sqliteTable('polls', {
  id: text('id').primaryKey(),
  showId: text('show_id').notNull(),
  question: text('question').notNull(),
  optionsJson: text('options_json').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
})

export const pollVotes = sqliteTable('poll_votes', {
  id: text('id').primaryKey(),
  pollId: text('poll_id').notNull(),
  voterKey: text('voter_key').notNull(),
  optionIdx: integer('option_idx').notNull(),
  createdAt: text('created_at').notNull(),
})

export const raiseHands = sqliteTable('raise_hands', {
  id: text('id').primaryKey(),
  showId: text('show_id').notNull(),
  userId: text('user_id').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
})

export const isoManifests = sqliteTable('iso_manifests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  showId: text('show_id').notNull(),
  kind: text('kind').notNull(),
  r2Key: text('r2_key').notNull(),
  status: text('status').notNull(),
  totalBytes: integer('total_bytes').notNull().default(0),
  totalParts: integer('total_parts').notNull().default(0),
  hash: text('hash'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const isoParts = sqliteTable('iso_parts', {
  id: text('id').primaryKey(),
  manifestId: text('manifest_id').notNull(),
  partNo: integer('part_no').notNull(),
  bytes: integer('bytes').notNull(),
  hash: text('hash').notNull(),
  status: text('status').notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  showId: text('show_id').notNull(),
  userId: text('user_id').notNull(),
  rtkSessionId: text('rtk_session_id').notNull(),
  createdAt: text('created_at').notNull(),
  endedAt: text('ended_at'),
})

export const tracks = sqliteTable('tracks', {
  id: text('id').primaryKey(),
  showId: text('show_id').notNull(),
  ownerSessionId: text('owner_session_id').notNull(),
  type: text('type').notNull(),
  rtkTrackId: text('rtk_track_id').notNull(),
  createdAt: text('created_at').notNull(),
  endedAt: text('ended_at'),
})

export type ShowRow = typeof shows.$inferSelect
export type PollRow = typeof polls.$inferSelect
export type PollVoteRow = typeof pollVotes.$inferSelect
export type RaiseHandRow = typeof raiseHands.$inferSelect
export type IsoManifestRow = typeof isoManifests.$inferSelect
export type IsoPartRow = typeof isoParts.$inferSelect
export type UserRow = typeof users.$inferSelect
export type SessionRow = typeof sessions.$inferSelect
export type TrackRow = typeof tracks.$inferSelect
