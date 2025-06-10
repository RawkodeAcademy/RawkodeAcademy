import { describe, it, expect } from "bun:test";
import * as schema from "../data-model/schema";

describe("Database Schema", () => {
  it("should have the castingCreditsTable defined", () => {
    // Check that the castingCreditsTable is defined
    expect(schema.castingCreditsTable).toBeDefined();
  });
});