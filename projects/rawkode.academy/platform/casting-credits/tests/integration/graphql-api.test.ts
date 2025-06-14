import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createYoga } from "graphql-yoga";
import { getSchema } from "../../read-model/schema";
import { execute, parse, GraphQLSchema } from "graphql";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../../data-model/schema";

/**
 * GraphQL API Integration Tests
 * 
 * These tests verify that our GraphQL API works correctly with a real database.
 * We use an in-memory SQLite database to avoid affecting production data.
 */
describe("GraphQL API Integration", () => {
  let graphqlSchema: GraphQLSchema;
  let yoga: ReturnType<typeof createYoga>;
  
  // Use an in-memory SQLite database for testing
  const client = createClient({
    url: "file::memory:",
  });
  
  const db = drizzle(client, { schema });
  
  // Note: In a full implementation, we would use dependency injection
  // to properly inject the test database. For now, this test focuses on
  // schema validation and basic resolver functionality.
  
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
    
    // Get the schema
    graphqlSchema = getSchema();
    
    // Create the yoga server
    yoga = createYoga({
      schema: graphqlSchema,
      graphqlEndpoint: "/",
    });
  });
  
  afterEach(async () => {
    // Drop the table
    await client.execute(`DROP TABLE IF EXISTS "casting-credits";`);
    
    // Clean up test resources
  });
  
  it("should execute introspection queries", async () => {
    const query = `
      {
        __schema {
          types {
            name
          }
        }
      }
    `;
    
    const result = await execute({
      schema: graphqlSchema,
      document: parse(query),
    });
    
    expect(result.errors).toBeUndefined();
    const types = result.data.__schema.types.map(t => t.name);
    expect(types).toContain("Video");
    expect(types).toContain("CastingCredit");
    expect(types).toContain("Person");
  });
  
  it("should handle _service queries for federation", async () => {
    const query = `
      {
        _service {
          sdl
        }
      }
    `;
    
    const result = await execute({
      schema: graphqlSchema,
      document: parse(query),
    });
    
    expect(result.errors).toBeUndefined();
    expect(result.data._service.sdl).toBeDefined();
    expect(result.data._service.sdl).toContain("type Video");
    expect(result.data._service.sdl).toContain("type CastingCredit");
  });
  
  it("should resolve Video.creditsForRole field", async () => {
    // This is a representation of how the resolver would be called in a federated graph
    // We're simulating the Video.creditsForRole resolver being called with a video object
    
    // Get the Video type's creditsForRole resolver
    const videoType = graphqlSchema.getType("Video");
    const fields = (videoType as any).getFields();
    const creditsForRoleField = fields.creditsForRole;
    const resolver = creditsForRoleField.resolve;
    
    // Call the resolver directly
    const result = await resolver({ id: "video1" }, { role: "host" });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].personId).toBe("person1");
  });
  
  it("should resolve Video.creditsForRole field with multiple results", async () => {
    // Add another host for video1
    await db.insert(schema.castingCreditsTable).values({
      personId: "person4",
      role: "host",
      videoId: "video1"
    });
    
    // Get the Video type's creditsForRole resolver
    const videoType = graphqlSchema.getType("Video");
    const fields = (videoType as any).getFields();
    const creditsForRoleField = fields.creditsForRole;
    const resolver = creditsForRoleField.resolve;
    
    // Call the resolver directly
    const result = await resolver({ id: "video1" }, { role: "host" });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    
    // Check that both person1 and person4 are in the results
    const personIds = result.map(r => r.personId);
    expect(personIds).toContain("person1");
    expect(personIds).toContain("person4");
  });
  
  it("should resolve CastingCredit.person field", async () => {
    // Get the CastingCredit type's person resolver
    const castingCreditType = graphqlSchema.getType("CastingCredit");
    const fields = (castingCreditType as any).getFields();
    const personField = fields.person;
    const resolver = personField.resolve;
    
    // Call the resolver directly
    const result = await resolver({ personId: "person1" });
    
    expect(result).toEqual({ id: "person1" });
  });
  
  it("should handle HTTP requests", async () => {
    const response = await yoga.fetch("http://localhost:4000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          {
            __schema {
              types {
                name
              }
            }
          }
        `,
      }),
    });
    
    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result.errors).toBeUndefined();
    
    const types = result.data.__schema.types.map((t: any) => t.name);
    expect(types).toContain("Video");
    expect(types).toContain("CastingCredit");
    expect(types).toContain("Person");
  });
  
  it("should handle errors gracefully", async () => {
    const response = await yoga.fetch("http://localhost:4000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          {
            nonExistentField
          }
        `,
      }),
    });
    
    expect(response.status).toBe(400);
    
    const result = await response.json();
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});