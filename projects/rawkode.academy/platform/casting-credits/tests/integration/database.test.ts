import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and } from "drizzle-orm";
import * as schema from "../../data-model/schema";

/**
 * Database Integration Tests
 * 
 * These tests verify that our database operations work correctly with a real database.
 * We use an in-memory SQLite database to avoid affecting production data.
 */
describe("Database Integration", () => {
  // Use an in-memory SQLite database for testing
  const client = createClient({
    url: "file::memory:",
  });
  
  const db = drizzle(client, { schema });
  
  beforeEach(async () => {
    // Create the table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "casting-credits" (
        "person_id" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "video_id" TEXT NOT NULL,
        PRIMARY KEY ("person_id", "role", "video_id")
      );
    `);
    
    // Seed test data
    await db.insert(schema.castingCreditsTable).values([
      { personId: "person1", role: "host", videoId: "video1" },
      { personId: "person2", role: "guest", videoId: "video1" },
      { personId: "person1", role: "host", videoId: "video2" },
      { personId: "person3", role: "guest", videoId: "video2" }
    ]);
  });
  
  afterEach(async () => {
    // Drop the table
    await client.execute(`DROP TABLE IF EXISTS "casting-credits";`);
  });
  
  it("should retrieve all casting credits", async () => {
    const credits = await db.select().from(schema.castingCreditsTable);
    
    expect(credits.length).toBe(4);
    expect(credits.some(c => 
      c.personId === "person1" && 
      c.role === "host" && 
      c.videoId === "video1"
    )).toBe(true);
  });
  
  it("should retrieve casting credits by video ID", async () => {
    const credits = await db
      .select()
      .from(schema.castingCreditsTable)
      .where(eq(schema.castingCreditsTable.videoId, "video1"));
    
    expect(credits.length).toBe(2);
    expect(credits.some(c => 
      c.personId === "person1" && 
      c.role === "host" && 
      c.videoId === "video1"
    )).toBe(true);
    expect(credits.some(c => 
      c.personId === "person2" && 
      c.role === "guest" && 
      c.videoId === "video1"
    )).toBe(true);
  });
  
  it("should retrieve casting credits by person ID", async () => {
    const credits = await db
      .select()
      .from(schema.castingCreditsTable)
      .where(eq(schema.castingCreditsTable.personId, "person1"));
    
    expect(credits.length).toBe(2);
    expect(credits.some(c => 
      c.personId === "person1" && 
      c.role === "host" && 
      c.videoId === "video1"
    )).toBe(true);
    expect(credits.some(c => 
      c.personId === "person1" && 
      c.role === "host" && 
      c.videoId === "video2"
    )).toBe(true);
  });
  
  it("should retrieve casting credits by role", async () => {
    const credits = await db
      .select()
      .from(schema.castingCreditsTable)
      .where(eq(schema.castingCreditsTable.role, "guest"));
    
    expect(credits.length).toBe(2);
    expect(credits.some(c => 
      c.personId === "person2" && 
      c.role === "guest" && 
      c.videoId === "video1"
    )).toBe(true);
    expect(credits.some(c => 
      c.personId === "person3" && 
      c.role === "guest" && 
      c.videoId === "video2"
    )).toBe(true);
  });
  
  it("should retrieve casting credits by video ID and role", async () => {
    const credits = await db
      .select()
      .from(schema.castingCreditsTable)
      .where(
        and(
          eq(schema.castingCreditsTable.videoId, "video1"),
          eq(schema.castingCreditsTable.role, "host")
        )
      );
    
    expect(credits.length).toBe(1);
    expect(credits[0].personId).toBe("person1");
    expect(credits[0].role).toBe("host");
    expect(credits[0].videoId).toBe("video1");
  });
  
  it("should insert a new casting credit", async () => {
    await db.insert(schema.castingCreditsTable).values({
      personId: "person4",
      role: "producer",
      videoId: "video1"
    });
    
    const credits = await db
      .select()
      .from(schema.castingCreditsTable)
      .where(
        and(
          eq(schema.castingCreditsTable.personId, "person4"),
          eq(schema.castingCreditsTable.role, "producer"),
          eq(schema.castingCreditsTable.videoId, "video1")
        )
      );
    
    expect(credits.length).toBe(1);
    expect(credits[0].personId).toBe("person4");
    expect(credits[0].role).toBe("producer");
    expect(credits[0].videoId).toBe("video1");
  });
  
  it("should delete a casting credit", async () => {
    await db
      .delete(schema.castingCreditsTable)
      .where(
        and(
          eq(schema.castingCreditsTable.personId, "person1"),
          eq(schema.castingCreditsTable.role, "host"),
          eq(schema.castingCreditsTable.videoId, "video1")
        )
      );
    
    const credits = await db
      .select()
      .from(schema.castingCreditsTable)
      .where(
        and(
          eq(schema.castingCreditsTable.personId, "person1"),
          eq(schema.castingCreditsTable.role, "host"),
          eq(schema.castingCreditsTable.videoId, "video1")
        )
      );
    
    expect(credits.length).toBe(0);
  });
  
  it("should update a casting credit", async () => {
    // First, let's add a credit we can update
    await db.insert(schema.castingCreditsTable).values({
      personId: "person5",
      role: "guest",
      videoId: "video3"
    });
    
    // Now, let's delete it and insert a new one with a different role
    // (since we can't update primary key fields directly)
    await db
      .delete(schema.castingCreditsTable)
      .where(
        and(
          eq(schema.castingCreditsTable.personId, "person5"),
          eq(schema.castingCreditsTable.role, "guest"),
          eq(schema.castingCreditsTable.videoId, "video3")
        )
      );
      
    await db.insert(schema.castingCreditsTable).values({
      personId: "person5",
      role: "host", // Changed from guest to host
      videoId: "video3"
    });
    
    // Verify the update
    const credits = await db
      .select()
      .from(schema.castingCreditsTable)
      .where(
        and(
          eq(schema.castingCreditsTable.personId, "person5"),
          eq(schema.castingCreditsTable.videoId, "video3")
        )
      );
    
    expect(credits.length).toBe(1);
    expect(credits[0].role).toBe("host");
  });
  
  it("should handle transactions correctly", async () => {
    // Start a transaction
    await client.execute("BEGIN TRANSACTION");
    
    try {
      // Insert a new credit
      await db.insert(schema.castingCreditsTable).values({
        personId: "person6",
        role: "director",
        videoId: "video4"
      });
      
      // Commit the transaction
      await client.execute("COMMIT");
    } catch (error) {
      // Rollback on error
      await client.execute("ROLLBACK");
      throw error;
    }
    
    // Verify the insert was committed
    const credits = await db
      .select()
      .from(schema.castingCreditsTable)
      .where(
        and(
          eq(schema.castingCreditsTable.personId, "person6"),
          eq(schema.castingCreditsTable.role, "director"),
          eq(schema.castingCreditsTable.videoId, "video4")
        )
      );
    
    expect(credits.length).toBe(1);
  });
  
  it("should handle rollback correctly", async () => {
    // Start a transaction
    await client.execute("BEGIN TRANSACTION");
    
    // Insert a new credit
    await db.insert(schema.castingCreditsTable).values({
      personId: "person7",
      role: "editor",
      videoId: "video5"
    });
    
    // Rollback the transaction
    await client.execute("ROLLBACK");
    
    // Verify the insert was rolled back
    const credits = await db
      .select()
      .from(schema.castingCreditsTable)
      .where(
        and(
          eq(schema.castingCreditsTable.personId, "person7"),
          eq(schema.castingCreditsTable.role, "editor"),
          eq(schema.castingCreditsTable.videoId, "video5")
        )
      );
    
    expect(credits.length).toBe(0);
  });
});