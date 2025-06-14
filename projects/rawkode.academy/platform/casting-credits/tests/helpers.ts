import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "../data-model/schema";
import { getMigrationsFolder } from "../data-model/database-utils";

/**
 * Creates an in-memory SQLite database for testing
 */
export function createTestDb() {
  // Create an in-memory SQLite database
  const sqlite = new Database(":memory:");
  
  // Create the drizzle client
  const db = drizzle(sqlite, { schema });
  
  // Run migrations using the shared migration utility
  migrate(db, {
    migrationsFolder: getMigrationsFolder(),
  });
  
  return { db, sqlite };
}

/**
 * Seed the database with test data
 * @param db - Database instance
 * @param customData - Optional custom data to seed. If not provided, uses test-specific default data
 */
export async function seedTestData(
  db: ReturnType<typeof createTestDb>["db"],
  customData?: Array<{ personId: string; role: string; videoId: string }>
) {
  const testDefaultData = [
    { personId: "person1", role: "host", videoId: "video1" },
    { personId: "person2", role: "guest", videoId: "video1" },
    { personId: "person1", role: "host", videoId: "video2" },
    { personId: "person3", role: "guest", videoId: "video2" },
  ];
  
  const dataToInsert = customData || testDefaultData;
  await db.insert(schema.castingCreditsTable).values(dataToInsert);
}

/**
 * Clean up the database after tests
 */
export async function cleanupTestDb(db: ReturnType<typeof createTestDb>["db"]) {
  await db.delete(schema.castingCreditsTable);
}