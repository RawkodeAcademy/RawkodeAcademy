import { SignJWT, jwtVerify } from "jose";
import type { KVNamespace } from "@cloudflare/workers-types";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const AUDIENCE = "com.atproto";

export interface AuthEnv {
  SETTINGS: KVNamespace;
  PDS_DID: string;
  PDS_HANDLE: string;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
}

export interface SessionTokens {
  accessJwt: string;
  refreshJwt: string;
  did: string;
  handle: string;
}

export interface SessionClaims {
  did: string;
  handle: string;
  sessionId: string;
  scope: string[];
  jti: string;
}

interface StoredSecrets {
  adminPassword: string;
  jwtSecret: string;
}

const encoder = new TextEncoder();

async function getSecret(env: AuthEnv): Promise<StoredSecrets> {
  const adminPassword = env.ADMIN_PASSWORD;
  const jwtSecret = env.JWT_SECRET ?? (await env.SETTINGS.get("auth:jwtSecret"));

  if (!adminPassword) {
    throw new Error("Missing ADMIN_PASSWORD secret");
  }
  if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET secret");
  }

  return { adminPassword, jwtSecret };
}

export async function verifyPassword(env: AuthEnv, password: string): Promise<boolean> {
  const { adminPassword } = await getSecret(env);
  return timingSafeEqual(adminPassword, password);
}

export async function issueSessionTokens(
  env: AuthEnv,
  sessionId: string,
  scope: string[]
): Promise<SessionTokens> {
  const { jwtSecret } = await getSecret(env);
  const key = encoder.encode(jwtSecret);
  const now = Math.floor(Date.now() / 1000);

  const commonClaims = {
    did: env.PDS_DID,
    handle: env.PDS_HANDLE,
    scope,
    sessionId
  } satisfies Record<string, unknown>;

  const accessJwt = await new SignJWT({ ...commonClaims, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.PDS_DID)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TOKEN_TTL_SECONDS)
    .setJti(`${sessionId}:access`)
    .setSubject(env.PDS_DID)
    .sign(key);

  const refreshJti = `${sessionId}:refresh`;
  const refreshJwt = await new SignJWT({ ...commonClaims, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.PDS_DID)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + REFRESH_TOKEN_TTL_SECONDS)
    .setJti(refreshJti)
    .setSubject(env.PDS_DID)
    .sign(key);

  await env.SETTINGS.put(
    `session:${refreshJti}`,
    JSON.stringify({ sessionId, scope, issuedAt: now }),
    { expirationTtl: REFRESH_TOKEN_TTL_SECONDS }
  );

  return { accessJwt, refreshJwt, did: env.PDS_DID, handle: env.PDS_HANDLE };
}

export async function verifyAccessToken(env: AuthEnv, token: string): Promise<SessionClaims> {
  return verifyToken(env, token, "access");
}

export async function verifyRefreshToken(env: AuthEnv, token: string): Promise<SessionClaims> {
  const claims = await verifyToken(env, token, "refresh");
  const entry = await env.SETTINGS.get(`session:${claims.jti}`);
  if (!entry) {
    throw new Error("Refresh token has been revoked");
  }
  return claims;
}

async function verifyToken(env: AuthEnv, token: string, expectedType: "access" | "refresh") {
  const { jwtSecret } = await getSecret(env);
  const key = encoder.encode(jwtSecret);
  const { payload } = await jwtVerify(token, key, {
    issuer: env.PDS_DID,
    audience: AUDIENCE,
    subject: env.PDS_DID
  });

  if (payload.type !== expectedType) {
    throw new Error("Unexpected token type");
  }

  const sessionId = typeof payload.sessionId === "string" ? payload.sessionId : payload.sid;
  if (typeof sessionId !== "string") {
    throw new Error("Session missing sid");
  }

  const scope = Array.isArray(payload.scope)
    ? (payload.scope.filter((value): value is string => typeof value === "string") as string[])
    : [];

  if (typeof payload.jti !== "string") {
    throw new Error("Token missing jti");
  }

  return {
    did: String(payload.did ?? env.PDS_DID),
    handle: String(payload.handle ?? env.PDS_HANDLE),
    sessionId,
    scope,
    jti: payload.jti
  } satisfies SessionClaims;
}

export async function revokeRefreshToken(env: AuthEnv, identifier: string): Promise<void> {
  await env.SETTINGS.delete(`session:${identifier}`);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
