import { describe, it, expect } from "bun:test";
import { getSchema } from "../read-model/schema";

describe("Casting Credits Resolvers", () => {
  it("should have the correct resolver for CastingCredit.person", () => {
    // Get the schema
    const schema = getSchema();
    
    // Get the CastingCredit type's person resolver
    const castingCreditType = schema.getType("CastingCredit");
    const fields = (castingCreditType as any).getFields();
    const personField = fields.person;
    const resolver = personField.resolve;
    
    // Call the resolver directly with a mock credit
    const mockCredit = { personId: "test-person-id" };
    const result = resolver(mockCredit);
    
    // The resolver should return an object with the id field set to the personId
    expect(result).toEqual({ id: "test-person-id" });
  });
});