import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// Main livestreams table with lifecycle status tracking
export const livestreamsTable = sqliteTable("livestreams", {
  id: text("id").primaryKey(), // Unique room ID (like Google Meet)
  livekitSid: text("livekit_sid").notNull().unique(), // LiveKit room SID
  displayName: text("display_name").notNull(), // User-friendly display name
  status: text("status", { enum: ["created", "running", "ended"] })
    .notNull()
    .default("created"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  startedAt: integer("started_at", { mode: "timestamp" }), // When room actually started (first participant joined)
  endedAt: integer("ended_at", { mode: "timestamp" }), // When room ended
});

// Participants table with upsert support
export const participantsTable = sqliteTable(
  "participants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roomId: text("room_id")
      .notNull()
      .references(() => livestreamsTable.id, { onDelete: "cascade" }),
    identity: text("identity").notNull(), // LiveKit participant identity
    name: text("name").notNull(), // Display name
  },
  (table) => [unique().on(table.roomId, table.identity)],
);

// Chat messages table
export const chatMessagesTable = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: text("room_id")
    .notNull()
    .references(() => livestreamsTable.id, { onDelete: "cascade" }),
  participantIdentity: text("participant_identity").notNull(),
  participantName: text("participant_name").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Polls table
export const pollsTable = sqliteTable("polls", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()), // Use crypto.randomUUID for new IDs
  livestreamId: text("livestream_id") // Changed from roomId to livestreamId for consistency
    .notNull()
    .references(() => livestreamsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").notNull(), // Store as JSON string: '["Option 1", "Option 2"]'
  status: text("status", { enum: ["draft", "open", "closed"] }) // Added 'draft' status
    .notNull()
    .default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  openedAt: integer("opened_at", { mode: "timestamp" }), // When the poll was opened for voting
  closedAt: integer("closed_at", { mode: "timestamp" }), // When the poll was closed
});

// Poll responses table
export const pollResponsesTable = sqliteTable("poll_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pollId: text("poll_id")
    .notNull()
    .references(() => pollsTable.id, { onDelete: "cascade" }),
  participantIdentity: text("participant_identity").notNull(), // Who submitted the response
  selectedOption: text("selected_option").notNull(), // Store the chosen option text or index as string
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
