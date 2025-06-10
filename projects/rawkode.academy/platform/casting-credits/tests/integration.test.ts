import { describe, it, expect } from "bun:test";
import { createYoga } from "graphql-yoga";
import { getSchema } from "../read-model/schema";

describe("Casting Credits Integration", () => {
  it("should create a valid yoga server", () => {
    // Create a yoga server with the schema
    const yoga = createYoga({
      schema: getSchema(),
      graphqlEndpoint: "/",
    });
    
    // Check that the yoga server was created successfully
    expect(yoga).toBeDefined();
    expect(typeof yoga.fetch).toBe("function");
  });
});