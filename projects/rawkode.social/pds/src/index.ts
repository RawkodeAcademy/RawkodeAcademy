import type {
  D1Database,
  DurableObjectNamespace,
  DurableObjectState,
  KVNamespace,
  R2Bucket
} from "@cloudflare/workers-types";
import { CID } from "multiformats/cid";
import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { asc, and, desc, eq, gt, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  BlockMap,
  Repo,
  WriteOpAction,
  blocksToCarFile,
  cborToLexRecord,
  cidForRecord,
  readCar,
  type RecordWriteOp
} from "@atproto/repo";
import { MessageFrame } from "@atproto/xrpc-server";
import { lexicons } from "@atproto/api";
import { TID, sha256RawToCid } from "@atproto/common";
import { sha256 } from "@atproto/crypto";
import { Secp256k1Keypair } from "@atproto/crypto";
import {
  issueSessionTokens,
  revokeRefreshToken,
  verifyAccessToken,
  verifyPassword,
  verifyRefreshToken,
  type SessionClaims
} from "./auth";
import { recordsIndex } from "./db/schema";
import { D1RepoStorage, type CommitEventLog } from "./storage";

interface Env {
  DB: D1Database;
  BLOBS: R2Bucket;
  SETTINGS: KVNamespace;
  FIREHOSE_DO: DurableObjectNamespace;
  PDS_DID: string;
  PDS_HANDLE: string;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
  PDS_SIGNING_KEY?: string;
}

type AppEnv = { Bindings: Env; Variables: { session: SessionClaims } };

type CommitOp =
  | { action: "create" | "update"; collection: string; rkey: string; cid: CID }
  | { action: "delete"; collection: string; rkey: string };

const app = new Hono<AppEnv>();

const keypairCache = new Map<string, Secp256k1Keypair>();

async function ensureAccount(env: Env) {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO user_account (did, handle) VALUES (?1, ?2)"
  )
    .bind(env.PDS_DID, env.PDS_HANDLE)
    .run();
}

async function loadKeypair(env: Env): Promise<Secp256k1Keypair> {
  const secret = env.PDS_SIGNING_KEY;
  if (!secret) {
    throw new Error("Missing PDS_SIGNING_KEY secret");
  }
  const cached = keypairCache.get(secret);
  if (cached) {
    return cached;
  }
  const keypair = await Secp256k1Keypair.import(secret, { exportable: true });
  keypairCache.set(secret, keypair);
  return keypair;
}

async function loadRepo(env: Env, storage: D1RepoStorage, keypair: Secp256k1Keypair) {
  const head = await storage.getRoot();
  if (!head) {
    await ensureAccount(env);
    return Repo.create(storage, env.PDS_DID, keypair);
  }
  return Repo.load(storage);
}

function resolveRepoIdentifier(input: unknown, env: Env): string | null {
  if (typeof input !== "string" || input.length === 0) {
    return env.PDS_DID;
  }
  const trimmed = input.startsWith("at://")
    ? input.slice("at://".length)
    : input.startsWith("@")
    ? input.slice(1)
    : input;
  if (trimmed === env.PDS_DID) return env.PDS_DID;
  if (trimmed === env.PDS_HANDLE) return env.PDS_DID;
  return null;
}

function requireRepoIdentifier(c: any, input: unknown): string | Response {
  const did = resolveRepoIdentifier(input, c.env);
  if (!did) {
    return c.json({ error: "RepoNotFound" }, 404);
  }
  return did;
}

function normalizeRecord(collection: string, raw: unknown, validate: boolean) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Record payload must be an object");
  }
  const record = { ...(raw as Record<string, unknown>) };
  if (typeof record.$type !== "string") {
    record.$type = collection;
  }
  if (validate) {
    lexicons.assertValidRecord(collection, record);
  }
  return record;
}

async function ensureSwapCommit(storage: D1RepoStorage, expected: unknown) {
  if (typeof expected !== "string") return;
  const head = await storage.getCurrentHead();
  if (!head || head.cid.toString() !== expected) {
    throw Object.assign(new Error("InvalidSwap"), { code: "InvalidSwap" });
  }
}

async function buildCommitEvent(
  env: Env,
  storage: D1RepoStorage,
  commit: Awaited<ReturnType<Repo["formatCommit"]>>,
  operations: CommitOp[],
  blobs: CID[] = []
) {
  const seq = await storage.getNextSequence();
  const car = await blocksToCarFile(commit.cid, commit.relevantBlocks);
  const eventTime = new Date().toISOString();
  const ops = operations.map((op) => {
    const base = { action: op.action, path: `${op.collection}/${op.rkey}` };
    return op.action === "delete"
      ? base
      : { ...base, cid: op.cid };
  });
  const event = {
    $type: "com.atproto.sync.subscribeRepos#commit",
    seq,
    rebase: false,
    tooBig: false,
    repo: env.PDS_DID,
    commit: commit.cid,
    prev: commit.prev ?? null,
    rev: commit.rev,
    since: commit.since,
    blocks: car,
    ops,
    blobs,
    time: eventTime
  };
  lexicons.assertValidXrpcMessage("com.atproto.sync.subscribeRepos#commit", event);
  const frame = new MessageFrame(event, { type: "#commit" }).toBytes();
  return { repo: env.PDS_DID, eventTime, car, frame, seq } satisfies CommitEventLog & {
    frame: Uint8Array;
    seq: number;
  };
}

async function broadcastFrame(env: Env, frame: Uint8Array) {
  if (!env.FIREHOSE_DO) return;
  const id = env.FIREHOSE_DO.idFromName("firehose");
  const stub = env.FIREHOSE_DO.get(id);
  await stub.fetch("https://firehose/broadcast", {
    method: "POST",
    headers: { "content-type": "application/cbor" },
    body: frame
  });
}

async function indexRecord(
  env: Env,
  did: string,
  collection: string,
  rkey: string,
  cid: CID
) {
  const uri = `at://${did}/${collection}/${rkey}`;
  await env.DB.prepare(
    `INSERT INTO records_index (uri, did, collection, rkey, cid) VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(uri) DO UPDATE SET cid=excluded.cid, indexed_at=(strftime('%s','now')*1000)`
  )
    .bind(uri, did, collection, rkey, cid.toString())
    .run();
  return uri;
}

async function deleteIndex(env: Env, did: string, collection: string, rkey: string) {
  await env.DB.prepare(
    "DELETE FROM records_index WHERE did = ?1 AND collection = ?2 AND rkey = ?3"
  )
    .bind(did, collection, rkey)
    .run();
}

const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    return c.json({ error: "AuthenticationRequired" }, 401);
  }
  try {
    const claims = await verifyAccessToken(c.env, token);
    c.set("session", claims);
    await next();
  } catch (error) {
    console.error("token verification failed", error);
    return c.json({ error: "InvalidToken" }, 401);
  }
};

app.get("/.well-known/did.json", (c) => {
  const host = c.req.header("host");
  return c.json({
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: c.env.PDS_DID,
    alsoKnownAs: [`at://${c.env.PDS_HANDLE}`],
    service: [
      {
        id: "#atproto",
        type: "AtprotoPersonalDataServer",
        serviceEndpoint: `https://${host}`
      }
    ]
  });
});

app.get("/.well-known/atproto-did", (c) => c.text(c.env.PDS_DID));

app.get("/xrpc/com.atproto.server.describeServer", (c) =>
  c.json({
    did: c.env.PDS_DID,
    inviteCodeRequired: false,
    availableUserDomains: [c.env.PDS_HANDLE.split(".").slice(1).join(".")],
    links: {
      termsOfService: "https://rawkode.social/terms",
      privacyPolicy: "https://rawkode.social/privacy"
    }
  })
);

app.post("/xrpc/com.atproto.server.createSession", async (c) => {
  const body = await c.req.json();
  const { identifier, password } = body ?? {};
  if (identifier !== c.env.PDS_HANDLE && identifier !== c.env.PDS_DID) {
    return c.json({ error: "AccountNotFound" }, 404);
  }
  const valid = await verifyPassword(c.env, typeof password === "string" ? password : "");
  if (!valid) {
    return c.json({ error: "AuthenticationFailed" }, 401);
  }
  const sessionId = crypto.randomUUID();
  const tokens = await issueSessionTokens(c.env, sessionId, ["com.atproto.repo.write"]);
  return c.json({ ...tokens, active: true }, 201);
});

app.post("/xrpc/com.atproto.server.refreshSession", async (c) => {
  const body = await c.req.json();
  const refreshJwt = body?.refreshJwt;
  if (typeof refreshJwt !== "string") {
    return c.json({ error: "InvalidRefreshRequest" }, 400);
  }
  try {
    const claims = await verifyRefreshToken(c.env, refreshJwt);
    await revokeRefreshToken(c.env, claims.jti);
    const sessionId = crypto.randomUUID();
    const tokens = await issueSessionTokens(c.env, sessionId, claims.scope);
    return c.json({ ...tokens, active: true });
  } catch (error) {
    console.error("refresh failed", error);
    return c.json({ error: "InvalidRefreshToken" }, 401);
  }
});

app.post("/xrpc/com.atproto.server.deleteSession", requireAuth, async (c) => {
  const session = c.get("session");
  await revokeRefreshToken(c.env, `${session.sessionId}:refresh`);
  return c.json({ success: true });
});

app.get("/xrpc/com.atproto.server.getSession", requireAuth, (c) => {
  const session = c.get("session");
  return c.json({ did: session.did, handle: session.handle, active: true });
});

app.post("/xrpc/com.atproto.repo.createRecord", requireAuth, async (c) => {
  const payload = await c.req.json();
  const repoDid = requireRepoIdentifier(c, payload?.repo);
  if (repoDid instanceof Response) return repoDid;
  const collection = typeof payload?.collection === "string" ? payload.collection : null;
  if (!collection) {
    return c.json({ error: "InvalidCollection" }, 400);
  }
  const validate = payload?.validate !== false;
  let record;
  try {
    record = normalizeRecord(collection, payload?.record, validate);
  } catch (error) {
    return c.json({ error: "InvalidRecord", message: (error as Error).message }, 400);
  }
  const rkey = typeof payload?.rkey === "string" ? payload.rkey : TID.nextStr();

  const storage = new D1RepoStorage(c.env.DB, repoDid);
  const keypair = await loadKeypair(c.env);
  const repo = await loadRepo(c.env, storage, keypair);

  try {
    await ensureSwapCommit(storage, payload?.swapCommit);
  } catch (error) {
    return c.json({ error: (error as { code?: string }).code ?? "InvalidSwap" }, 409);
  }

  const recordCid = await cidForRecord(record);
  const write = { action: WriteOpAction.Create, collection, rkey, record } as const;
  const commit = await repo.formatCommit(write, keypair);
  const operations: CommitOp[] = [{ action: "create", collection, rkey, cid: recordCid }];
  const { car, frame, eventTime, seq } = await buildCommitEvent(
    c.env,
    storage,
    commit,
    operations
  );
  await storage.applyCommitWithEvent(commit, {
    repo: repoDid,
    car,
    frame,
    eventTime,
    seq
  });

  const uri = await indexRecord(c.env, repoDid, collection, rkey, recordCid);
  await broadcastFrame(c.env, frame);

  return c.json(
    {
      uri,
      cid: recordCid.toString(),
      value: record,
      commit: {
        cid: commit.cid.toString(),
        rev: commit.rev,
        prev: commit.prev ? commit.prev.toString() : undefined
      },
      validationStatus: validate ? "valid" : "unknown"
    },
    201
  );
});

app.post("/xrpc/com.atproto.repo.putRecord", requireAuth, async (c) => {
  const payload = await c.req.json();
  const repoDid = requireRepoIdentifier(c, payload?.repo);
  if (repoDid instanceof Response) return repoDid;
  const collection = typeof payload?.collection === "string" ? payload.collection : null;
  const rkey = typeof payload?.rkey === "string" ? payload.rkey : null;
  if (!collection || !rkey) {
    return c.json({ error: "InvalidRecordPath" }, 400);
  }
  const validate = payload?.validate !== false;
  let record;
  try {
    record = normalizeRecord(collection, payload?.record, validate);
  } catch (error) {
    return c.json({ error: "InvalidRecord", message: (error as Error).message }, 400);
  }

  const storage = new D1RepoStorage(c.env.DB, repoDid);
  const keypair = await loadKeypair(c.env);
  const repo = await loadRepo(c.env, storage, keypair);

  try {
    await ensureSwapCommit(storage, payload?.swapCommit);
  } catch (error) {
    return c.json({ error: (error as { code?: string }).code ?? "InvalidSwap" }, 409);
  }

  const existing = await getRecordByRkey(c.env, repoDid, collection, rkey);
  if (!existing && payload?.swapRecord && payload.swapRecord !== null) {
    return c.json({ error: "InvalidSwap" }, 409);
  }
  if (existing && typeof payload?.swapRecord === "string" && existing.cid !== payload.swapRecord) {
    return c.json({ error: "InvalidSwap" }, 409);
  }

  const recordCid = await cidForRecord(record);
  const write = { action: existing ? WriteOpAction.Update : WriteOpAction.Create, collection, rkey, record } as const;
  const commit = await repo.formatCommit(write, keypair);
  const operations: CommitOp[] = existing
    ? [{ action: "update", collection, rkey, cid: recordCid }]
    : [{ action: "create", collection, rkey, cid: recordCid }];
  const { car, frame, eventTime, seq } = await buildCommitEvent(
    c.env,
    storage,
    commit,
    operations
  );
  await storage.applyCommitWithEvent(commit, {
    repo: repoDid,
    car,
    frame,
    eventTime,
    seq
  });

  const uri = await indexRecord(c.env, repoDid, collection, rkey, recordCid);
  await broadcastFrame(c.env, frame);

  return c.json({
    uri,
    cid: recordCid.toString(),
    value: record,
    commit: {
      cid: commit.cid.toString(),
      rev: commit.rev,
      prev: commit.prev ? commit.prev.toString() : undefined
    },
    validationStatus: validate ? "valid" : "unknown"
  });
});

app.post("/xrpc/com.atproto.repo.deleteRecord", requireAuth, async (c) => {
  const payload = await c.req.json();
  const repoDid = requireRepoIdentifier(c, payload?.repo);
  if (repoDid instanceof Response) return repoDid;
  const collection = typeof payload?.collection === "string" ? payload.collection : null;
  const rkey = typeof payload?.rkey === "string" ? payload.rkey : null;
  if (!collection || !rkey) {
    return c.json({ error: "InvalidRecordPath" }, 400);
  }

  const storage = new D1RepoStorage(c.env.DB, repoDid);
  const keypair = await loadKeypair(c.env);
  const repo = await loadRepo(c.env, storage, keypair);

  try {
    await ensureSwapCommit(storage, payload?.swapCommit);
  } catch (error) {
    return c.json({ error: (error as { code?: string }).code ?? "InvalidSwap" }, 409);
  }

  const existing = await getRecordByRkey(c.env, repoDid, collection, rkey);
  if (!existing) {
    return c.json({ error: "RecordNotFound" }, 404);
  }
  if (typeof payload?.swapRecord === "string" && existing.cid !== payload.swapRecord) {
    return c.json({ error: "InvalidSwap" }, 409);
  }
  if (payload?.swapRecord === null) {
    return c.json({ error: "InvalidSwap" }, 409);
  }

  const write = { action: WriteOpAction.Delete, collection, rkey } as const;
  const commit = await repo.formatCommit(write, keypair);
  const operations: CommitOp[] = [{ action: "delete", collection, rkey }];
  const { car, frame, eventTime, seq } = await buildCommitEvent(
    c.env,
    storage,
    commit,
    operations
  );
  await storage.applyCommitWithEvent(commit, {
    repo: repoDid,
    car,
    frame,
    eventTime,
    seq
  });

  await deleteIndex(c.env, repoDid, collection, rkey);
  await broadcastFrame(c.env, frame);

  return c.json({
    commit: {
      cid: commit.cid.toString(),
      rev: commit.rev,
      prev: commit.prev ? commit.prev.toString() : undefined
    }
  });
});

app.post("/xrpc/com.atproto.repo.applyWrites", requireAuth, async (c) => {
  const payload = await c.req.json();
  const repoDid = requireRepoIdentifier(c, payload?.repo);
  if (repoDid instanceof Response) return repoDid;
  const writes = Array.isArray(payload?.writes) ? payload.writes : null;
  if (!writes || writes.length === 0) {
    return c.json({ error: "InvalidWrites" }, 400);
  }
  const validate = payload?.validate !== false;

  const storage = new D1RepoStorage(c.env.DB, repoDid);
  const keypair = await loadKeypair(c.env);
  const repo = await loadRepo(c.env, storage, keypair);

  try {
    await ensureSwapCommit(storage, payload?.swapCommit);
  } catch (error) {
    return c.json({ error: (error as { code?: string }).code ?? "InvalidSwap" }, 409);
  }

  const operations: RecordWriteOp[] = [];
  const commitOps: CommitOp[] = [];
  const results: unknown[] = [];

  for (const entry of writes) {
    if (!entry || typeof entry !== "object") {
      return c.json({ error: "InvalidWrites" }, 400);
    }
    const type = entry.$type as string | undefined;
    if (type === "com.atproto.repo.applyWrites#create") {
      const collection = typeof entry.collection === "string" ? entry.collection : null;
      if (!collection) return c.json({ error: "InvalidRecord" }, 400);
      const rkey = typeof entry.rkey === "string" ? entry.rkey : TID.nextStr();
      let record;
      try {
        record = normalizeRecord(collection, entry.value, validate);
      } catch (error) {
        return c.json({ error: "InvalidRecord", message: (error as Error).message }, 400);
      }
      const cid = await cidForRecord(record);
      operations.push({ action: WriteOpAction.Create, collection, rkey, record });
      commitOps.push({ action: "create", collection, rkey, cid });
      results.push({
        $type: "com.atproto.repo.applyWrites#createResult",
        uri: `at://${repoDid}/${collection}/${rkey}`,
        cid: cid.toString(),
        validationStatus: validate ? "valid" : "unknown"
      });
    } else if (type === "com.atproto.repo.applyWrites#update") {
      const collection = typeof entry.collection === "string" ? entry.collection : null;
      const rkey = typeof entry.rkey === "string" ? entry.rkey : null;
      if (!collection || !rkey) return c.json({ error: "InvalidRecord" }, 400);
      const existing = await getRecordByRkey(c.env, repoDid, collection, rkey);
      if (!existing) {
        return c.json({ error: "RecordNotFound" }, 404);
      }
      let record;
      try {
        record = normalizeRecord(collection, entry.value, validate);
      } catch (error) {
        return c.json({ error: "InvalidRecord", message: (error as Error).message }, 400);
      }
      const cid = await cidForRecord(record);
      operations.push({ action: WriteOpAction.Update, collection, rkey, record });
      commitOps.push({ action: "update", collection, rkey, cid });
      results.push({
        $type: "com.atproto.repo.applyWrites#updateResult",
        uri: existing.uri,
        cid: cid.toString(),
        validationStatus: validate ? "valid" : "unknown"
      });
    } else if (type === "com.atproto.repo.applyWrites#delete") {
      const collection = typeof entry.collection === "string" ? entry.collection : null;
      const rkey = typeof entry.rkey === "string" ? entry.rkey : null;
      if (!collection || !rkey) return c.json({ error: "InvalidRecord" }, 400);
      const existing = await getRecordByRkey(c.env, repoDid, collection, rkey);
      if (!existing) {
        return c.json({ error: "RecordNotFound" }, 404);
      }
      operations.push({ action: WriteOpAction.Delete, collection, rkey });
      commitOps.push({ action: "delete", collection, rkey });
      results.push({
        $type: "com.atproto.repo.applyWrites#deleteResult"
      });
    } else {
      return c.json({ error: "InvalidWrites" }, 400);
    }
  }

  const commitInput = operations.length === 1 ? operations[0] : operations;
  const commit = await repo.formatCommit(commitInput, keypair);
  const { car, frame, eventTime, seq } = await buildCommitEvent(
    c.env,
    storage,
    commit,
    commitOps
  );
  await storage.applyCommitWithEvent(commit, {
    repo: repoDid,
    car,
    frame,
    eventTime,
    seq
  });

  for (const op of commitOps) {
    if (op.action === "delete") {
      await deleteIndex(c.env, repoDid, op.collection, op.rkey);
    } else {
      await indexRecord(c.env, repoDid, op.collection, op.rkey, op.cid);
    }
  }

  await broadcastFrame(c.env, frame);

  return c.json({
    commit: {
      cid: commit.cid.toString(),
      rev: commit.rev,
      prev: commit.prev ? commit.prev.toString() : undefined
    },
    results
  });
});

app.get("/xrpc/com.atproto.repo.listRecords", async (c) => {
  const repoDid = requireRepoIdentifier(c, c.req.query("repo"));
  if (repoDid instanceof Response) return repoDid;
  const collection = c.req.query("collection");
  if (!collection) {
    return c.json({ error: "MissingCollection" }, 400);
  }
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
  const cursorValue = c.req.query("cursor");
  const reverse = c.req.query("reverse") === "true";

  const db = drizzle(c.env.DB);
  let condition = and(
    eq(recordsIndex.did, repoDid),
    eq(recordsIndex.collection, collection)
  );
  if (cursorValue) {
    const cursorNum = Number(cursorValue);
    if (!Number.isFinite(cursorNum)) {
      return c.json({ error: "InvalidCursor" }, 400);
    }
    condition = reverse
      ? and(condition, gt(recordsIndex.indexedAt, cursorNum))
      : and(condition, lt(recordsIndex.indexedAt, cursorNum));
  }

  const rows = await db
    .select()
    .from(recordsIndex)
    .where(condition)
    .orderBy(reverse ? asc(recordsIndex.indexedAt) : desc(recordsIndex.indexedAt))
    .limit(limit + 1);

  const nextCursor = rows.length > limit ? String(rows[limit].indexedAt) : undefined;
  const page = rows.slice(0, limit);

  const storage = new D1RepoStorage(c.env.DB, repoDid);
  const records = await Promise.all(
    page.map(async (row) => {
      const cid = CID.parse(row.cid);
      const bytes = await storage.getBytes(cid);
      const value = bytes ? cborToLexRecord(bytes) : null;
      return { uri: row.uri, cid: row.cid, value };
    })
  );

  return c.json({ records, cursor: nextCursor });
});

async function getRecordByRkey(
  env: Env,
  did: string,
  collection: string,
  rkey: string,
  cid?: string
) {
  const db = drizzle(env.DB);
  const row = await db
    .select()
    .from(recordsIndex)
    .where(
      and(
        eq(recordsIndex.did, did),
        eq(recordsIndex.collection, collection),
        eq(recordsIndex.rkey, rkey)
      )
    )
    .get();
  if (!row) {
    return null;
  }
  const storage = new D1RepoStorage(env.DB, did);
  const recordCid = cid ? CID.parse(cid) : CID.parse(row.cid);
  const bytes = await storage.getBytes(recordCid);
  if (!bytes) {
    return null;
  }
  return { uri: row.uri, cid: recordCid.toString(), value: cborToLexRecord(bytes) };
}

app.get("/xrpc/com.atproto.repo.getRecord", async (c) => {
  const repoDid = requireRepoIdentifier(c, c.req.query("repo"));
  if (repoDid instanceof Response) return repoDid;
  const collection = c.req.query("collection");
  const rkey = c.req.query("rkey");
  if (!collection || !rkey) {
    return c.json({ error: "MissingParams" }, 400);
  }
  const record = await getRecordByRkey(c.env, repoDid, collection, rkey, c.req.query("cid"));
  if (!record) {
    return c.json({ error: "RecordNotFound" }, 404);
  }
  return c.json(record);
});

app.get("/xrpc/com.atproto.sync.getRecord", async (c) => {
  const repoDid = requireRepoIdentifier(c, c.req.query("did"));
  if (repoDid instanceof Response) return repoDid;
  const collection = c.req.query("collection");
  const rkey = c.req.query("rkey");
  if (!collection || !rkey) {
    return c.json({ error: "MissingParams" }, 400);
  }
  const record = await getRecordByRkey(c.env, repoDid, collection, rkey, c.req.query("cid"));
  if (!record) {
    return c.json({ error: "RecordNotFound" }, 404);
  }
  return c.json(record);
});

app.get("/xrpc/com.atproto.sync.getLatestCommit", async (c) => {
  const repoDid = requireRepoIdentifier(c, c.req.query("did"));
  if (repoDid instanceof Response) return repoDid;
  const storage = new D1RepoStorage(c.env.DB, repoDid);
  const head = await storage.getCurrentHead();
  if (!head) {
    return c.json({ error: "RepoNotInitialized" }, 404);
  }
  return c.json({ cid: head.cid.toString(), rev: head.rev });
});

app.get("/xrpc/com.atproto.sync.listRepos", async (c) => {
  const repoDid = c.req.query("did")
    ? resolveRepoIdentifier(c.req.query("did"), c.env)
    : c.env.PDS_DID;
  if (!repoDid) {
    return c.json({ repos: [] });
  }
  const storage = new D1RepoStorage(c.env.DB, repoDid);
  const head = await storage.getCurrentHead();
  return c.json({
    repos: [
      {
        did: repoDid,
        head: head?.cid.toString() ?? null,
        rev: head?.rev ?? null
      }
    ]
  });
});

app.get("/xrpc/com.atproto.sync.getRepo", async (c) => {
  const repoDid = requireRepoIdentifier(c, c.req.query("did"));
  if (repoDid instanceof Response) return repoDid;
  const since = c.req.query("since");
  const storage = new D1RepoStorage(c.env.DB, repoDid);

  let carBytes: Uint8Array;
  if (since) {
    const commits = await storage.getCommitRowsSince(since);
    if (commits.length === 0) {
      return c.json({ error: "InvalidCursor" }, 400);
    }
    const diffBlocks = new BlockMap();
    for (const commit of commits) {
      if (!commit.car) continue;
      const { blocks } = await readCar(commit.car);
      diffBlocks.addMap(blocks);
    }
    const head = commits.at(-1)?.cid ?? (await storage.getCurrentHead())?.cid ?? null;
    carBytes = await blocksToCarFile(head, diffBlocks);
  } else {
    const result = await c.env.DB.prepare(
      "SELECT cid, data FROM repo_blocks"
    ).all<{ cid: string; data: ArrayBuffer }>();
    const blockMap = new BlockMap();
    for (const row of result.results ?? []) {
      blockMap.set(CID.parse(row.cid), new Uint8Array(row.data));
    }
    const head = await storage.getCurrentHead();
    carBytes = await blocksToCarFile(head?.cid ?? null, blockMap);
  }

  return new Response(carBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": "application/vnd.ipld.car",
      "content-length": String(carBytes.byteLength)
    }
  });
});

app.get("/xrpc/com.atproto.sync.getBlocks", async (c) => {
  const repoDid = requireRepoIdentifier(c, c.req.query("did"));
  if (repoDid instanceof Response) return repoDid;
  const cids = c.req.queries("cids");
  if (!cids || cids.length === 0) {
    return c.json({ error: "MissingCids" }, 400);
  }
  const parsed = cids.map((value) => {
    try {
      return CID.parse(value);
    } catch {
      return null;
    }
  });
  if (parsed.some((cid) => cid === null)) {
    return c.json({ error: "InvalidCid" }, 400);
  }
  const storage = new D1RepoStorage(c.env.DB, repoDid);
  const { blocks, missing } = await storage.getBlocks(parsed as CID[]);
  if (missing.length > 0) {
    return c.json({ error: "BlockNotFound" }, 404);
  }
  const carBytes = await blocksToCarFile(null, blocks);
  return new Response(carBytes as unknown as BodyInit, {
    status: 200,
    headers: { "content-type": "application/vnd.ipld.car" }
  });
});

app.get("/xrpc/com.atproto.sync.getBlob", async (c) => {
  const repoDid = requireRepoIdentifier(c, c.req.query("did"));
  if (repoDid instanceof Response) return repoDid;
  const cidParam = c.req.query("cid");
  if (!cidParam) {
    return c.json({ error: "BlobNotFound" }, 404);
  }
  const object = await c.env.BLOBS.get(cidParam);
  if (!object) {
    return c.json({ error: "BlobNotFound" }, 404);
  }
  const headers = new Headers();
  if (object.httpMetadata?.contentType) {
    headers.set("content-type", object.httpMetadata.contentType);
  }
  if (object.httpMetadata?.contentLanguage) {
    headers.set("content-language", object.httpMetadata.contentLanguage);
  }
  if (object.httpMetadata?.contentDisposition) {
    headers.set("content-disposition", object.httpMetadata.contentDisposition);
  }
  return new Response(object.body as unknown as ReadableStream, { headers });
});

app.post("/xrpc/com.atproto.repo.uploadBlob", requireAuth, async (c) => {
  const bytes = new Uint8Array(await c.req.arrayBuffer());
  if (bytes.byteLength === 0) {
    return c.json({ error: "EmptyBlob" }, 400);
  }
  const mimeType = c.req.header("content-type") ?? "application/octet-stream";
  const hash = await sha256(bytes);
  const cid = sha256RawToCid(hash);
  await c.env.BLOBS.put(cid.toString(), bytes, {
    httpMetadata: { contentType: mimeType }
  });
  return c.json({
    blob: {
      $type: "blob",
      ref: { $link: cid.toString() },
      mimeType,
      size: bytes.byteLength
    }
  });
});

app.get("/xrpc/com.atproto.sync.subscribeRepos", async (c) => {
  const id = c.env.FIREHOSE_DO.idFromName("firehose");
  const stub = c.env.FIREHOSE_DO.get(id);
  const request = new Request(c.req.url, c.req.raw);
  const response = await (stub.fetch as any)(request as any);
  return response as unknown as Response;
});

app.get("/blobs/:cid", async (c) => {
  const object = await c.env.BLOBS.get(c.req.param("cid"));
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }
  const headers = new Headers();
  if (object.httpMetadata?.contentType) {
    headers.set("content-type", object.httpMetadata.contentType);
  }
  if (object.httpMetadata?.contentLanguage) {
    headers.set("content-language", object.httpMetadata.contentLanguage);
  }
  if (object.httpMetadata?.contentDisposition) {
    headers.set("content-disposition", object.httpMetadata.contentDisposition);
  }
  return new Response(object.body as unknown as ReadableStream, { headers });
});

export default app;

export class FirehoseDurableObject {
  private sockets = new Set<WebSocket>();

  constructor(private readonly state: DurableObjectState) {}

  private attach(socket: WebSocket) {
    socket.accept();
    socket.binaryType = "arraybuffer";
    this.sockets.add(socket);
    const remove = () => this.sockets.delete(socket);
    socket.addEventListener("close", remove);
    socket.addEventListener("error", remove);
  }

  private broadcast(message: Uint8Array) {
    for (const socket of [...this.sockets]) {
      try {
        socket.send(message);
      } catch (error) {
        console.error("firehose broadcast failed", error);
        this.sockets.delete(socket);
      }
    }
  }

  private async replay(env: Env, socket: WebSocket, cursor: number) {
    const storage = new D1RepoStorage(env.DB, env.PDS_DID);
    const frames = await storage.getCommitFramesAfter(cursor);
    for (const entry of frames) {
      try {
        socket.send(entry.frame);
      } catch (error) {
        console.error("firehose replay failed", error);
        break;
      }
    }
  }

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      const cursorParam = url.searchParams.get("cursor");
      const cursor = cursorParam ? Number(cursorParam) : 0;
      if (cursorParam && !Number.isFinite(cursor)) {
        return new Response("Invalid cursor", { status: 400 });
      }
      const pair = new WebSocketPair();
      this.attach(pair[1]);
      await this.replay(env, pair[1], cursor);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (request.method === "POST" && url.pathname === "/broadcast") {
      const body = new Uint8Array(await request.arrayBuffer());
      this.broadcast(body);
      return new Response(null, { status: 202 });
    }
    return new Response("Not Found", { status: 404 });
  }
}
