import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "../data-model/schema";

/**
 * Creates an in-memory SQLite database for testing
 */
export function createTestDb() {
  // Create an in-memory SQLite database
  const sqlite = new Database(":memory:");
  
  // Create the drizzle client
  const db = drizzle(sqlite, { schema });
  
  // Create the tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "casting-credits" (
      "person_id" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "video_id" TEXT NOT NULL,
      PRIMARY KEY ("person_id", "role", "video_id")
    );
  `);
  
  return { db, sqlite };
}

/**
 * Seed the database with test data
 */
export async function seedTestData(db: ReturnType<typeof createTestDb>["db"]) {
  await db.insert(schema.castingCreditsTable).values([
    { personId: "person1", role: "host", videoId: "video1" },
    { personId: "person2", role: "guest", videoId: "video1" },
    { personId: "person1", role: "host", videoId: "video2" },
    { personId: "person3", role: "guest", videoId: "video2" },
  ]);
}

/**
 * Clean up the database after tests
 */
export async function cleanupTestDb(db: ReturnType<typeof createTestDb>["db"]) {
  await db.delete(schema.castingCreditsTable);
}