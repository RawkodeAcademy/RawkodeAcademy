// @ts-nocheck
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './env'
import { Shows } from './do'
import { Sessions } from './do-session'
export { Shows, Sessions }

import { getDb } from './db/client'
import { shows, polls, pollVotes, isoManifests, isoParts, sessions, users, tracks } from './db/schema'
import { eq, sql } from 'drizzle-orm'

const app = new Hono<{ Bindings: Bindings }>()

// CORS (dev/prod-friendly, reflect origin)
app.use('*', cors({
  origin: (origin) => origin ?? '*',
  allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowHeaders: ['content-type', 'x-part-no', 'x-content-sha256'],
}))

// ---- Health ----
app.get('/health', async (c) => {
  let dbOk = false
  try {
    const db = getDb(c.env)
    // lightweight query; returns null or a row, just testing access
    await db.select().from(shows).limit(1).get()
    dbOk = true
  } catch {
    dbOk = false
  }
  return c.json({ ok: true, db: dbOk, time: new Date().toISOString() })
})

// ---- Sessions ----
app.post('/sessions', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const resp = await createSession(c.env, body)
  return fromResponse(resp)
})

app.get('/sessions/:id', async (c) => {
  const resp = await getSession(c.env, c.req.param('id'))
  return fromResponse(resp)
})

app.get('/sessions/:id/state/snapshot', async (c) => {
  const id = c.req.param('id')
  const stub = c.env.SESSIONS.get(c.env.SESSIONS.idFromName(id))
  const resp = await stub.fetch(new URL('/snapshot', c.req.url).toString(), { method: 'GET' })
  const text = await resp.text()
  return c.newResponse(text, { status: resp.status, headers: { 'content-type': 'application/json' } })
})

app.post('/sessions/:id/raise-hand', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const stub = c.env.SESSIONS.get(c.env.SESSIONS.idFromName(id))
  const resp = await stub.fetch(new URL('/raise-hand', c.req.url).toString(), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: id, userId: body.userId })
  })
  const text = await resp.text()
  return c.newResponse(text, { status: resp.status, headers: { 'content-type': 'application/json' } })
})

// ---- Shows ----
app.post('/shows', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const resp = await createShow(c.env, body)
  return fromResponse(resp)
})

app.get('/shows/:id', async (c) => {
  const resp = await getShow(c.env, c.req.param('id'))
  return fromResponse(resp)
})

app.get('/shows/:id/state/snapshot', async (c) => {
  const id = c.req.param('id')
  const stub = c.env.SHOWS.get(c.env.SHOWS.idFromName(id))
  const resp = await stub.fetch(new URL('/snapshot', c.req.url).toString(), { method: 'GET' })
  const text = await resp.text()
  return c.newResponse(text, { status: resp.status, headers: { 'content-type': 'application/json' } })
})

app.post('/shows/:id/raise-hand', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const stub = c.env.SHOWS.get(c.env.SHOWS.idFromName(id))
  const resp = await stub.fetch(new URL('/raise-hand', c.req.url).toString(), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ showId: id, userId: body.userId })
  })
  const text = await resp.text()
  return c.newResponse(text, { status: resp.status, headers: { 'content-type': 'application/json' } })
})

// ---- Polls ----
app.post('/polls', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const resp = await createPoll(c.env, body)
  return fromResponse(resp)
})

app.post('/polls/:id', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const resp = await castVote(c.env, c.req.param('id'), body)
  return fromResponse(resp)
})

// ---- ISO Uploads ----
app.post('/uploads/iso/init', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const resp = await isoInit(c.env, body)
  return fromResponse(resp)
})

app.put('/uploads/iso/:id/part', async (c) => {
  const resp = await isoAppendPart(c.env, c.req.raw, c.req.param('id'))
  return fromResponse(resp)
})

app.post('/uploads/iso/:id/complete', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const resp = await isoComplete(c.env, c.req.param('id'), body)
  return fromResponse(resp)
})

app.post('/uploads/iso/:id/abort', async (c) => {
  const resp = await isoAbort(c.env, c.req.param('id'))
  return fromResponse(resp)
})

// ---- RTK Proxy ----
app.post('/rtk/create-session', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const role = String(body?.role || 'publisher') as 'publisher' | 'viewer'
  const ownerSessionId = typeof body?.ownerSessionId === 'string' ? body.ownerSessionId : null
  const resp = await rtkCreateSession(c.env, role, c.req.raw, ownerSessionId)
  return fromResponse(resp)
})

app.post('/rtk/sessions/:id/tracks/new', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const resp = await rtkTracksNew(c.env, c.req.param('id'), body, c.req.raw)
  return fromResponse(resp)
})

app.get('/rtk/program/:ownerSessionId', async (c) => {
  const ownerSessionId = c.req.param('ownerSessionId')
  const db = getDb(c.env)
  const row = await db.select().from(tracks)
    .where(sql`${tracks.ownerSessionId} = ${ownerSessionId} AND ${tracks.type} = 'PROGRAM'`)
    .orderBy(sql`created_at DESC` as any)
    .get()
  return c.json({ trackId: row?.rtkTrackId || null })
})

// Default 404
app.all('*', (c) => c.json({ error: 'Not Found' }, 404))

export default app

async function createShow(env: Env, body: any): Promise<Response> {
  const id = crypto.randomUUID();
  const title = String(body?.title ?? 'Untitled Show');
  const startsAt = new Date(body?.startsAt ?? Date.now()).toISOString();
  const description = String(body?.description ?? '');
  const createdBy = String(body?.createdBy ?? 'system');
  const status = 'SCHEDULED';

  const db = getDb(env);
  await db.insert(shows).values({ id, title, startsAt, description, createdBy, status }).run();
  const show = { id, title, startsAt, description, createdBy, status };
  return json({ show }, 201);
}

async function getShow(env: Env, id: string): Promise<Response> {
  const db = getDb(env);
  const row = await db.select().from(shows).where(eq(shows.id, id)).get();
  if (!row) return json({ error: `Show ${id} not found` }, 404);
  const show = {
    id: row.id,
    title: row.title,
    startsAt: row.startsAt,
    description: row.description ?? '',
    createdBy: row.createdBy,
    status: row.status,
  };
  return json({ show });
}

async function createPoll(env: Env, body: any): Promise<Response> {
  const id = crypto.randomUUID();
  const showId = String(body?.showId);
  const question = String(body?.question ?? '');
  const options = Array.isArray(body?.options) ? body.options.map(String) : [];
  if (!showId || !question || options.length < 2) {
    return json({ error: 'Invalid poll payload' }, 400);
  }

  const db = getDb(env);
  await db.insert(polls).values({
    id,
    showId,
    question,
    optionsJson: JSON.stringify(options),
    status: 'draft',
    createdAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
  }).run();

  return json({ poll: { id, showId, question, options, status: 'draft' } }, 201);
}

async function castVote(env: Env, pollId: string, body: any): Promise<Response> {
  const voterKey = String(body?.voterKey ?? '');
  const optionIdx = Number(body?.optionIndex);
  if (!voterKey || !Number.isInteger(optionIdx) || optionIdx < 0) {
    return json({ error: 'Invalid vote payload' }, 400);
  }

  const db = getDb(env);
  const existing = await db.select({ ok: pollVotes.id }).from(pollVotes)
    .where(sql`${pollVotes.pollId} = ${pollId} AND ${pollVotes.voterKey} = ${voterKey}`)
    .get();
  if (existing) return json({ error: 'Duplicate vote' }, 409);

  const id = crypto.randomUUID();
  await db.insert(pollVotes).values({
    id,
    pollId,
    voterKey,
    optionIdx,
    createdAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
  }).run();

  return json({ vote: { id, pollId, voterKey, optionIndex: optionIdx } }, 201);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function fromResponse(resp: Response): Response {
  // passthrough helper for Hono handlers using existing functions
  return resp
}

// Minimal Env typing to avoid full CF types
import type { DurableObjectNamespace, DurableObjectId, DurableObjectStub, R2Bucket, R2Object } from './env'
import type { D1Database } from './env'

// ---- ISO helpers ----
type ManifestRow = {
  id: string
  user_id: string
  show_id: string
  kind: string
  r2_key: string
  status: string
  total_bytes: number
  total_parts: number
  hash: string | null
};

function isoBaseKey(sessionId: string, userId: string, kind: string) {
  // aligns with docs/storage-layout.md
  return `sessions/${sessionId}/iso/${userId}/${kind}`;
}

function padPart(no: number) {
  return no.toString().padStart(6, '0');
}

async function getManifest(env: Env, id: string): Promise<ManifestRow | null> {
  const db = getDb(env);
  const row = await db.select().from(isoManifests).where(eq(isoManifests.id, id)).get();
  return (row as any) ?? null;
}

async function isoInit(env: Env, body: any): Promise<Response> {
  const sessionId = String(body?.sessionId ?? '');
  const userId = String(body?.userId ?? '');
  const kind = String(body?.kind ?? 'camera');
  if (!sessionId || !userId) return json({ error: 'sessionId and userId required' }, 400);

  const id = crypto.randomUUID();
  const base = isoBaseKey(sessionId, userId, kind);
  const manifestKey = `${base}/manifest.json`;

  const db = getDb(env);
  await db.insert(isoManifests).values({
    id, userId, showId: sessionId, kind, r2Key: manifestKey, status: 'UPLOADING',
    totalBytes: 0, totalParts: 0, hash: null,
    createdAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    updatedAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
  }).run();

  // Write initial manifest file to R2
  await env.R2_MEDIA.put(manifestKey, JSON.stringify({ id, sessionId, userId, kind, parts: [], status: 'UPLOADING' }));

  return json({ manifest: { id, sessionId, userId, kind, r2Key: manifestKey, status: 'UPLOADING' } }, 201);
}

async function isoAppendPart(env: Env, request: Request, manifestId: string): Promise<Response> {
  const manifest = await getManifest(env, manifestId);
  if (!manifest) return json({ error: `manifest ${manifestId} not found` }, 404);
  if (manifest.status !== 'UPLOADING') return json({ error: `manifest not accepting parts` }, 409);

  const partNoHeader = request.headers.get('x-part-no');
  const hashHeader = request.headers.get('x-content-sha256');
  if (!partNoHeader || !hashHeader) return json({ error: 'x-part-no and x-content-sha256 required' }, 400);

  const partNo = Number(partNoHeader);
  if (!Number.isInteger(partNo) || partNo < 0) return json({ error: 'invalid x-part-no' }, 400);

  const arrayBuffer = await request.arrayBuffer();
  const bytes = arrayBuffer.byteLength;
  if (bytes <= 0) return json({ error: 'empty body' }, 400);
  // Soft-limit: accept up to 64 MiB for dev; target is 8–32 MiB in production.
  if (bytes > 64 * 1024 * 1024) return json({ error: 'part too large' }, 413);

  const computedHash = await sha256Hex(arrayBuffer);
  if (computedHash !== hashHeader) return json({ error: 'hash mismatch' }, 400);

  const base = manifest.r2_key.replace(/\/manifest\.json$/, '');
  const partKey = `${base}/part-${padPart(partNo)}`;
  await env.R2_MEDIA.put(partKey, arrayBuffer);

  const partId = crypto.randomUUID();
  const db = getDb(env);
  await db.insert(isoParts).values({
    id: partId,
    manifestId,
    partNo,
    bytes,
    hash: computedHash,
    status: 'UPLOADING',
  }).run();

  await db.update(isoManifests)
    .set({
      totalBytes: sql`${isoManifests.totalBytes} + ${bytes}`,
      totalParts: sql`${isoManifests.totalParts} + 1`,
      updatedAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    })
    .where(eq(isoManifests.id, manifestId))
    .run();

  return json({ ok: true, key: partKey, bytes });
}

async function isoComplete(env: Env, manifestId: string, body: any): Promise<Response> {
  const manifest = await getManifest(env, manifestId);
  if (!manifest) return json({ error: `manifest ${manifestId} not found` }, 404);
  const finalHash = String(body?.hash ?? '');

  const db = getDb(env);
  await db.update(isoManifests)
    .set({ status: 'COMPLETE', hash: finalHash || null, updatedAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')` })
    .where(eq(isoManifests.id, manifestId))
    .run();

  // Update R2 manifest.json snapshot
  const manifestJsonKey = manifest.r2_key;
  const updated = {
    id: manifest.id,
    showId: manifest.show_id,
    userId: manifest.user_id,
    kind: manifest.kind,
    status: 'COMPLETE',
    hash: finalHash || null,
  };
  await env.R2_MEDIA.put(manifestJsonKey, JSON.stringify(updated));

  return json({ manifest: { id: manifestId, status: 'COMPLETE', hash: finalHash || null } });
}

async function isoAbort(env: Env, manifestId: string): Promise<Response> {
  const manifest = await getManifest(env, manifestId);
  if (!manifest) return json({ error: `manifest ${manifestId} not found` }, 404);

  const db = getDb(env);
  await db.update(isoManifests)
    .set({ status: 'FAILED', updatedAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')` })
    .where(eq(isoManifests.id, manifestId))
    .run();

  return json({ manifest: { id: manifestId, status: 'FAILED' } });
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}
// ---- RTK proxy (stub for dev) ----
// removed unused rtkOfferAnswer to reduce surface area

async function rtkCreateSession(env: Env, role: 'publisher' | 'viewer', req: Request, ownerSessionId: string | null): Promise<Response> {
  const appId = (env as any).RTK_APP_ID as string | undefined
  const secret = await getRtkSecret(env)
  const base = ((env as any).RTK_BASE_URL as string | undefined) || ''
  const fake = (env as any).RTK_FAKE === 'true' || !(appId && secret && base)
  if (fake) return json({ rtkSessionId: `fake-${crypto.randomUUID()}`, mode: 'fake' }, 200, req)

  try {
    const url = `${base.replace(/\/$/, '')}/apps/${encodeURIComponent(appId)}/sessions/new`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ role }),
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return json({ error: `RTK sessions/new ${resp.status}`, details: text }, 502, req)
    }
    const data = await resp.json() as any
    const rtkSessionId = data.id || data.sessionId || null
    // Optionally persist mapping to our app session
    if (rtkSessionId && ownerSessionId) {
      try {
        const db = getDb(env)
        await db.update(sessions)
          .set({ rtkSessionId, createdAt: sql`created_at` })
          .where(eq(sessions.id, ownerSessionId))
          .run()
      } catch {}
    }
    // Expect { id, iceServers? }
    return json({ rtkSessionId, iceServers: data.iceServers || null, mode: 'rtk' }, 200, req)
  } catch (e: any) {
    return json({ error: 'RTK create session failed', details: e?.message ?? String(e) }, 502, req)
  }
}

async function rtkTracksNew(env: Env, rtkSessionId: string, body: any, req: Request): Promise<Response> {
  const appId = (env as any).RTK_APP_ID as string | undefined
  const secret = await getRtkSecret(env)
  const base = ((env as any).RTK_BASE_URL as string | undefined) || ''
  const sdp = String(body?.sdp || '')
  const meta = body?.meta || {}
  const fake = (env as any).RTK_FAKE === 'true' || !(appId && secret && base)
  if (fake) return json({ sdp: null, iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }], tracks: [], mode: 'fake' }, 200, req)

  try {
    const url = `${base.replace(/\/$/, '')}/v1/apps/${encodeURIComponent(appId)}/sessions/${encodeURIComponent(rtkSessionId)}/tracks/new`
    const payload: any = { sdp }
    if (Array.isArray(meta?.subscribe) && meta.subscribe.length) {
      payload.subscribe = meta.subscribe
      payload.location = meta?.location || 'remote'
    } else {
      payload.location = meta?.location || 'local'
    }
    // Pass through optional simulcast preferences if provided
    if (meta?.simulcast) payload.simulcast = meta.simulcast

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return json({ error: `RTK tracks/new ${resp.status}`, details: text }, 502, req)
    }
    const data = await resp.json() as any
    // Try to persist track IDs (from response if present, otherwise fetch session info)
    try {
      const db = getDb(env)
      const owner = String(meta?.ownerSessionId || '')
      const list: string[] = []
      if (Array.isArray(data.tracks)) {
        for (const t of data.tracks) if (t?.id && typeof t.id === 'string') list.push(t.id)
      }
      if (list.length === 0) {
        const info = await fetchRtkSessionInfo(base, appId, secret!, rtkSessionId)
        for (const id of info.videoTrackIds) list.push(id)
      }
      for (const id of list) {
        await db.insert(tracks).values({
          id: crypto.randomUUID(),
          showId: meta?.showId || owner || 'unknown',
          ownerSessionId: owner || 'unknown',
          type: meta?.type || 'PROGRAM',
          rtkTrackId: id,
          createdAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
          endedAt: null,
        }).run()
      }
    } catch {}
    return json({ sdp: data.sdp ?? null, iceServers: data.iceServers ?? null, tracks: data.tracks ?? [] }, 200, req)
  } catch (e: any) {
    return json({ error: 'RTK tracks/new failed', details: e?.message ?? String(e) }, 502, req)
  }
}

async function fetchRtkSessionInfo(base: string, appId: string, secret: string, rtkSessionId: string): Promise<{ videoTrackIds: string[] }> {
  const url = `${base.replace(/\/$/, '')}/v1/apps/${encodeURIComponent(appId)}/sessions/${encodeURIComponent(rtkSessionId)}`
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } })
  if (!resp.ok) return { videoTrackIds: [] }
  const data: any = await resp.json().catch(() => ({}))
  const ids: string[] = []
  // Try to extract track ids heuristically
  const scan = (obj: any) => {
    if (!obj || typeof obj !== 'object') return
    if (Array.isArray(obj)) { obj.forEach(scan); return }
    if (obj.kind === 'video' && typeof obj.id === 'string') ids.push(obj.id)
    for (const k of Object.keys(obj)) scan(obj[k])
  }
  scan(data)
  return { videoTrackIds: Array.from(new Set(ids)) }
}

import type { Bindings } from './env'
async function getRtkSecret(env: Bindings): Promise<string | undefined> {
  const direct = (env as any)?.RTK_APP_SECRET as string | undefined
  if (direct && typeof direct === 'string' && direct.length > 0) return direct
  const bound = env?.STUDIO_REALTIME_TOKEN
  if (bound && typeof (bound as any).get === 'function') {
    try {
      const v = await bound.get()
      if (v && typeof v === 'string') return v
    } catch {}
  }
  return undefined
}
async function createSession(env: Env, body: any): Promise<Response> {
  const id = crypto.randomUUID();
  let showId = body?.showId ? String(body.showId) : null;
  const userId = String(body?.userId ?? 'producer-ui');
  const rtkSessionId = `local-${id}`; // placeholder until RTK integration
  const db = getDb(env);
  if (!showId) {
    // Create a minimal "Instant Studio" show to satisfy FK constraint
    showId = crypto.randomUUID();
    // Ensure a producer user exists to satisfy shows.created_by FK
    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).get();
    if (!existingUser) {
      await db.insert(users).values({
        id: userId,
        atprotoDid: `did:local:${userId}`,
        role: 'PRODUCER',
        createdAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      }).run();
    }
    await db.insert(shows).values({
      id: showId,
      title: body?.title ? String(body.title) : 'Instant Studio',
      startsAt: new Date().toISOString(),
      description: body?.description ? String(body.description) : '',
      createdBy: userId,
      status: 'SCHEDULED',
    }).run();
  }
  await db.insert(sessions).values({
    id,
    showId: showId,
    userId,
    rtkSessionId,
    createdAt: sql`strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    endedAt: null,
  }).run();
  return json({ session: { id, showId, userId, rtkSessionId } }, 201);
}

async function getSession(env: Env, id: string): Promise<Response> {
  const db = getDb(env);
  const row = await db.select().from(sessions).where(eq(sessions.id, id)).get();
  if (!row) return json({ error: `Session ${id} not found` }, 404);
  return json({ session: row });
}
