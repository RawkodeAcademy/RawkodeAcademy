import type { KVNamespace } from "@cloudflare/workers-types";
import { describe, expect, it } from "vitest";
import { verifyPassword, type AuthEnv } from "../auth";

const fakeKv = {
  get: async () => null,
  getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
  put: async () => {},
  delete: async () => {},
  list: async () => ({ keys: [], list_complete: true, cursor: undefined, cacheStatus: null })
} as unknown as KVNamespace;

describe("verifyPassword", () => {
  const baseEnv: AuthEnv = {
    SETTINGS: fakeKv,
    PDS_DID: "did:web:pds.example.com",
    PDS_HANDLE: "me.example.com",
    ADMIN_PASSWORD: "supersafe",
    JWT_SECRET: "jwt-secret"
  };

  it("accepts the configured admin password", async () => {
    await expect(verifyPassword(baseEnv, "supersafe")).resolves.toBe(true);
  });

  it("rejects incorrect credentials", async () => {
    await expect(verifyPassword(baseEnv, "wrong"))
      .resolves.toBe(false);
  });
});
