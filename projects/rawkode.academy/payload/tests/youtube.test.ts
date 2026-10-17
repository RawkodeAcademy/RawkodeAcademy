import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authorizeUrl, updateVideoSnippet, YouTubeError } from '../src/youtube/api'
import { beginConnect, finishConnect, nonceCookie } from '../src/youtube/connect'
import { scheduleSync } from '../src/youtube/hook'
import { actionFor, type ChannelSyncState, type ChannelTarget, desiredFor, desiredHash, timestamp, type VideoSnapshot } from '../src/youtube/plan'
import { decryptToken, encryptToken, signState, verifyState } from '../src/youtube/secrets'
import { runSync, type Step, type SyncParams } from '../src/youtube/sync'

const key = Buffer.alloc(32, 7).toString('base64')
const now = Date.parse('2026-10-18T12:00:00.000Z')

const video = (overrides: Partial<VideoSnapshot> = {}): VideoSnapshot => ({
  id: 7, legacyId: 'abc123', slug: 'swamp-club', title: 'Hands-on Introduction to Swamp Club',
  description: 'We build a platform with Swamp Club.', type: 'live', publishedAt: '2026-11-05T17:00:00.000Z',
  duration: 3600, youtubeId: null, tags: ['Kubernetes', 'Swamp Club'], chapters: [], ...overrides,
})
const channel: ChannelTarget = { id: 3, youtubeChannelId: 'UCrawkode', streamId: 'stream-1', privacy: 'public' }

// Fake Google + YouTube that records every call.
function google(options: { broadcast?: { lifeCycleStatus: string; scheduledStartTime: string }; snippet?: Record<string, unknown> | null; fail?: { path: string; status: number; reason: string } } = {}) {
  const calls: { method: string; path: string; body: any }[] = []
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  const fetcher = (async (input: string | URL, init: RequestInit = {}) => {
    const url = new URL(String(input))
    const method = init.method ?? 'GET'
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body instanceof URLSearchParams ? Object.fromEntries(init.body) : undefined
    calls.push({ method, path: url.pathname, body })
    if (options.fail && url.pathname.endsWith(options.fail.path)) return json({ error: { message: 'nope', errors: [{ reason: options.fail.reason }] } }, options.fail.status)
    if (url.pathname === '/token') return json(body.grant_type === 'authorization_code'
      ? { access_token: 'access', refresh_token: 'refresh-secret', expires_in: 3600, scope: 'youtube' }
      : { access_token: 'access', expires_in: 3600, scope: 'youtube' })
    if (url.pathname.endsWith('/channels')) return json({ items: [{ id: 'UCrawkode', snippet: { title: 'Rawkode Academy' } }] })
    if (url.pathname.endsWith('/liveStreams')) return json({ id: 'stream-new' })
    if (url.pathname.endsWith('/liveBroadcasts/bind')) return json({ id: url.searchParams.get('id') })
    if (url.pathname.endsWith('/liveBroadcasts') && method === 'POST') return json({ id: 'yt-broadcast' })
    if (url.pathname.endsWith('/liveBroadcasts') && method === 'GET') return json({ items: options.broadcast ? [{ id: 'yt-broadcast', snippet: { title: 'Old', scheduledStartTime: options.broadcast.scheduledStartTime }, status: { lifeCycleStatus: options.broadcast.lifeCycleStatus } }] : [] })
    if (url.pathname.endsWith('/liveBroadcasts') && method === 'PUT') return json({ id: body.id })
    if (url.pathname.endsWith('/videos') && method === 'GET') return json({ items: options.snippet === null ? [] : [{ snippet: options.snippet ?? { title: 'Old title', description: 'Old', categoryId: '28', defaultLanguage: 'en', thumbnails: {}, channelId: 'UCrawkode' } }] })
    if (url.pathname.endsWith('/videos') && method === 'PUT') return json({ id: body.id })
    return json({ error: { message: `unexpected ${method} ${url.pathname}` } }, 500)
  }) as typeof fetch
  const writes = () => calls.filter(call => call.method !== 'GET' && call.path !== '/token').map(call => `${call.method} ${call.path.replace('/youtube/v3', '')}`)
  return { calls, fetcher, writes }
}

async function store(initial: Record<string, ChannelSyncState> = {}) {
  const records: ChannelSyncState[] = []
  const state = { ...initial }
  return {
    records,
    store: {
      credential: async () => ({ youtubeChannelId: 'UCrawkode', refreshToken: await encryptToken(key, 'refresh-secret', '3') }),
      record: async (_video: number, channelId: number, next: ChannelSyncState) => {
        records.push(next)
        state[String(channelId)] = { ...state[String(channelId)], ...next, youtubeVideoId: state[String(channelId)]?.youtubeVideoId ?? next.youtubeVideoId }
      },
      syncState: async () => state,
    },
  }
}

// Runs steps inline and fails if a step name repeats (Workflows caches by name).
function steps(): Step & { names: string[] } {
  const names: string[] = []
  return {
    names,
    async do(name, _config, run) {
      assert(!names.includes(name), `duplicate step name ${name}`)
      names.push(name)
      return run()
    },
  }
}

async function params(snapshot: VideoSnapshot, target = channel): Promise<SyncParams> {
  const desired = desiredFor(snapshot)
  return { video: snapshot, channel: target, desired, hash: await desiredHash(desired, target) }
}

test('the YouTube copy is built from the CMS fields within YouTube limits', () => {
  assert.equal(timestamp(0), '00:00')
  assert.equal(timestamp(3725), '1:02:05')
  const desired = desiredFor(video({
    title: 'x'.repeat(150), description: 'Uses <generics>.',
    chapters: [{ title: 'Demo', startTime: 600 }, { title: 'Intro', startTime: 0 }],
    tags: ['Kubernetes', 'kubernetes', 'Swamp Club', ...Array.from({ length: 80 }, (_, index) => `tag-${index}`)],
  }))
  assert.equal(desired.title.length, 100)
  assert(desired.description.startsWith('Uses generics.\n\nChapters\n00:00 Intro\n10:00 Demo'))
  assert(desired.description.endsWith('https://rawkode.academy/watch/swamp-club'))
  assert.deepEqual(desired.tags.slice(0, 2), ['Kubernetes', 'Swamp Club'])
  assert(desired.tags.join(',').length <= 500)
  assert.equal(desired.scheduledStartTime, '2026-11-05T17:00:00.000Z')
  assert.equal(desired.scheduledEndTime, '2026-11-05T18:00:00.000Z')
  assert.equal(desiredFor(video({ type: 'recorded' })).scheduledStartTime, null)
  assert(desiredFor(video({ description: 'y'.repeat(6000) })).description.length <= 5000)
})

test('only selected videos are touched, and back-catalogue videos are adopted, not re-created', () => {
  assert.deepEqual(actionFor(video(), undefined, now), { kind: 'create-broadcast' })
  assert.deepEqual(actionFor(video(), { youtubeVideoId: 'known' }, now), { kind: 'update', youtubeVideoId: 'known' })
  assert.deepEqual(actionFor(video({ youtubeId: 'existing' }), undefined, now), { kind: 'adopt', youtubeVideoId: 'existing' })
  assert.equal(actionFor(video({ publishedAt: '2026-01-01T00:00:00.000Z' }), undefined, now).kind, 'unsupported')
  assert.equal(actionFor(video({ type: 'recorded' }), undefined, now).kind, 'unsupported')
})

test('refresh tokens are sealed per channel and OAuth state is bound to the browser', async () => {
  const sealed = await encryptToken(key, 'refresh-secret', '3')
  assert(!sealed.includes('refresh-secret'))
  assert.equal(await decryptToken(key, sealed, '3'), 'refresh-secret')
  await assert.rejects(decryptToken(key, sealed, '4'), 'a token cannot be moved to another channel row')
  await assert.rejects(decryptToken(Buffer.alloc(32, 8).toString('base64'), sealed, '3'))
  await assert.rejects(encryptToken('c2hvcnQ=', 'x', '3'), /32 bytes/)
  await assert.rejects(encryptToken('not base64!', 'x', '3'), /base64/)

  const state = await signState(key, { channel: 3, nonce: 'n1', expiresAt: now + 1000 })
  assert.deepEqual(await verifyState(key, state, 'n1', now), { channel: 3, nonce: 'n1', expiresAt: now + 1000 })
  await assert.rejects(verifyState(key, state, 'other', now), /different browser/)
  await assert.rejects(verifyState(key, state, null, now), /different browser/)
  await assert.rejects(verifyState(key, state, 'n1', now + 2000), /expired/)
  const [body, signature] = state.split('.')
  const forged = Buffer.from(JSON.stringify({ channel: 4, nonce: 'n1', expiresAt: now + 1000 })).toString('base64url')
  await assert.rejects(verifyState(key, `${forged}.${signature}`, 'n1', now), /signature/)
  assert.ok(body)

  const url = new URL(authorizeUrl({ clientId: 'id', clientSecret: 's', redirectUri: 'https://admin.rawkode.academy/api/youtube/callback' }, state))
  assert.equal(url.searchParams.get('access_type'), 'offline')
  assert.equal(url.searchParams.get('prompt'), 'consent')
  assert.equal(url.searchParams.get('scope'), 'https://www.googleapis.com/auth/youtube.force-ssl')
})

test('a snippet update keeps fields the CMS does not own', async () => {
  const { fetcher, calls } = google()
  await updateVideoSnippet(fetcher, 'access', 'vid', { title: 'Old', description: 'Old', categoryId: '28', defaultLanguage: 'en', thumbnails: {}, channelId: 'UC', publishedAt: 'x', liveBroadcastContent: 'upcoming' }, { title: 'New', description: 'New', tags: ['k8s'] })
  assert.deepEqual(calls[0]!.body, { id: 'vid', snippet: { categoryId: '28', defaultLanguage: 'en', title: 'New', description: 'New', tags: ['k8s'] } })
  assert.equal(new YouTubeError(403, 'quotaExceeded', 'x').retryable, false)
  assert.equal(new YouTubeError(503, 'backendError', 'x').retryable, true)
})

test('scheduling a live episode creates, binds and fills one broadcast', async () => {
  const yt = google()
  const s = await store()
  const step = steps()
  const input = await params(video())
  const result = await runSync({ store: s.store, fetcher: yt.fetcher, tokenKey: key, client: { clientId: 'id', clientSecret: 's' }, now: () => now }, input, step)
  assert.deepEqual(yt.writes(), ['POST /liveBroadcasts', 'POST /liveBroadcasts/bind', 'PUT /videos'])
  const insert = yt.calls.find(call => call.path.endsWith('/liveBroadcasts') && call.method === 'POST')!
  assert.equal(insert.body.snippet.scheduledStartTime, '2026-11-05T17:00:00.000Z')
  assert.equal(insert.body.status.privacyStatus, 'public')
  assert.equal(yt.calls.find(call => call.path.endsWith('/bind'))!.method, 'POST')
  assert.deepEqual(yt.calls.find(call => call.method === 'PUT')!.body.snippet.tags, ['Kubernetes', 'Swamp Club'])
  // The broadcast id is stored before anything else can fail.
  assert.deepEqual(s.records[0], { youtubeVideoId: 'yt-broadcast', state: 'scheduled', message: 'Broadcast created; binding stream', syncedAt: '2026-10-18T12:00:00.000Z' })
  assert.deepEqual(result, { youtubeVideoId: 'yt-broadcast', syncedHash: input.hash, state: 'scheduled' })
})

test('a later edit updates the same broadcast: reschedule, then copy, never a second insert', async () => {
  const yt = google({ broadcast: { lifeCycleStatus: 'ready', scheduledStartTime: '2026-11-05T17:00:00Z' } })
  const s = await store({ 3: { youtubeVideoId: 'yt-broadcast', state: 'scheduled' } })
  const moved = await params(video({ publishedAt: '2026-11-06T17:00:00.000Z', title: 'Renamed episode' }))
  const result = await runSync({ store: s.store, fetcher: yt.fetcher, tokenKey: key, client: { clientId: 'id', clientSecret: 's' }, now: () => now }, moved, steps())
  assert.deepEqual(yt.writes(), ['PUT /liveBroadcasts', 'PUT /videos'])
  assert.equal(yt.calls.find(call => call.method === 'PUT' && call.path.endsWith('/liveBroadcasts'))!.body.snippet.scheduledStartTime, '2026-11-06T17:00:00.000Z')
  assert.equal(result.state, 'scheduled')

  // Already live: the schedule can no longer move, but the copy still syncs.
  const live = google({ broadcast: { lifeCycleStatus: 'live', scheduledStartTime: '2026-11-05T17:00:00Z' } })
  const after = await runSync({ store: (await store({ 3: { youtubeVideoId: 'yt-broadcast' } })).store, fetcher: live.fetcher, tokenKey: key, client: { clientId: 'id', clientSecret: 's' }, now: () => now }, moved, steps())
  assert.deepEqual(live.writes(), ['PUT /videos'])
  assert.equal(after.state, 'synced')
})

test('unchanged copy costs no writes; adopting a recorded video syncs its copy only', async () => {
  const snapshot = video({ type: 'recorded', youtubeId: 'existing', publishedAt: '2024-01-01T00:00:00.000Z' })
  const desired = desiredFor(snapshot)
  const yt = google({ snippet: { title: desired.title, description: desired.description, tags: desired.tags, categoryId: '28' } })
  const result = await runSync({ store: (await store()).store, fetcher: yt.fetcher, tokenKey: key, client: { clientId: 'id', clientSecret: 's' }, now: () => now }, await params(snapshot), steps())
  assert.deepEqual(yt.writes(), [])
  assert.equal(result.youtubeVideoId, 'existing')
  assert.equal(result.state, 'synced')
})

test('permanent YouTube errors are recorded without the hash so the next publish retries', async () => {
  const yt = google({ fail: { path: '/liveBroadcasts', status: 403, reason: 'quotaExceeded' } })
  const s = await store()
  const result = await runSync({ store: s.store, fetcher: yt.fetcher, tokenKey: key, client: { clientId: 'id', clientSecret: 's' }, now: () => now }, await params(video()), steps())
  assert.equal(result.state, 'error')
  assert.match(String(result.message), /quotaExceeded/)
  assert.equal(s.records.at(-1)?.syncedHash, undefined)
  const transient = google({ fail: { path: '/liveBroadcasts', status: 503, reason: 'backendError' } })
  await assert.rejects(runSync({ store: (await store()).store, fetcher: transient.fetcher, tokenKey: key, client: { clientId: 'id', clientSecret: 's' }, now: () => now }, await params(video()), steps()), /backendError/)
})

test('a channel without a stored credential, or with a mismatched one, is refused', async () => {
  const s = await store()
  const result = await runSync({ store: { ...s.store, credential: async () => null }, fetcher: google().fetcher, tokenKey: key, client: { clientId: 'id', clientSecret: 's' }, now: () => now }, await params(video()), steps())
  assert.match(String(result.message), /not connected/)
  const other = await runSync({ store: { ...s.store, credential: async () => ({ youtubeChannelId: 'UCother', refreshToken: 'x' }) }, fetcher: google().fetcher, tokenKey: key, client: { clientId: 'id', clientSecret: 's' }, now: () => now }, await params(video()), steps())
  assert.match(String(other.message), /different YouTube channel/)
})

function fakePayload(docs: Record<string, Record<string, any>[]>, user: unknown = { collection: 'users', role: 'staff', id: 1 }) {
  const updates: any[] = []
  return {
    updates,
    payload: {
      auth: async () => ({ user }),
      find: async ({ collection, where }: any) => ({ docs: (docs[collection] ?? []).filter(doc => where.id.in.includes(doc.id)) }),
      findByID: async ({ collection, id }: any) => {
        const doc = (docs[collection] ?? []).find(item => item.id === id)
        if (!doc) throw new Error('Not found')
        return doc
      },
      update: async (args: any) => { updates.push(args); return {} },
      logger: { error: () => {} },
    } as never,
  }
}

function fakeD1() {
  const rows = new Map<string, any[]>()
  const statement = (sql: string, values: unknown[] = []) => ({
    bind: (...next: unknown[]) => statement(sql, next),
    run: async () => { rows.set(sql.trim().split(/\s+/).slice(0, 3).join(' '), values); return {} },
    first: async () => null,
    all: async () => ({ results: [] as any[] }),
  })
  return { rows, db: { prepare: (sql: string) => statement(sql) } as unknown as D1Database }
}

test('publishing queues one workflow per connected channel and skips content already in sync', async () => {
  const { payload } = fakePayload({
    channels: [{ id: 3, connection: 'connected', youtubeChannelId: 'UCrawkode', streamId: 'stream-1', privacy: 'unlisted' }, { id: 4, connection: 'disconnected' }],
    technologies: [{ id: 11, name: 'Kubernetes' }],
    chapters: [{ id: 21, title: 'Intro', startTime: 0 }],
  })
  const created: string[] = []
  const workflow = { create: async ({ id }: { id: string }) => { if (created.includes(id)) throw new Error('instance already exists'); created.push(id) } }
  const doc = { id: 7, legacyId: 'abc', slug: 'swamp-club', title: 'Swamp Club live', description: 'A long enough description.', type: 'live', publishedAt: '2026-11-05T17:00:00.000Z', channels: [3, 4], technologies: [11], chapters: [21], terms: [{ value: 'platform', id: 'r1' }] }
  const env = { D1: fakeD1().db, YOUTUBE_SYNC_WORKFLOW: workflow }
  const started = await scheduleSync(payload, doc, env)
  assert.equal(started.length, 1, 'disconnected channels are skipped')
  assert.match(started[0]!, /^yt-7-3-[0-9a-f]{32}$/)
  assert.deepEqual(await scheduleSync(payload, doc, env), [], 'same content, same instance id')
  assert.deepEqual(await scheduleSync(payload, doc, { D1: env.D1 }), [], 'no binding in previews')
})

test('connecting stores a sealed token for the owning account only', async () => {
  const env = { D1: fakeD1().db, GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret', YOUTUBE_REDIRECT_URI: 'https://admin.rawkode.academy/api/youtube/callback', YOUTUBE_TOKEN_KEY: key }
  const { payload } = fakePayload({ channels: [{ id: 3 }] })
  const start = await beginConnect(new Request('https://admin.rawkode.academy/api/youtube/connect?channel=3'), payload, env, now)
  assert.equal(start.status, 302)
  const location = new URL(start.headers.get('location')!)
  const nonce = start.headers.get('set-cookie')!.match(new RegExp(`${nonceCookie}=([^;]+)`))![1]
  const state = location.searchParams.get('state')!
  const callback = (cookieNonce: string) => new Request(`https://admin.rawkode.academy/api/youtube/callback?code=abc&state=${encodeURIComponent(state)}`, { headers: { cookie: `${nonceCookie}=${cookieNonce}` } })

  assert.equal((await finishConnect(callback('stolen'), payload, env, google().fetcher, now)).status, 400)

  const d1 = fakeD1()
  const ok = fakePayload({ channels: [{ id: 3 }] })
  const response = await finishConnect(callback(nonce!), ok.payload, { ...env, D1: d1.db }, google().fetcher, now)
  assert.equal(response.status, 302)
  assert.equal(response.headers.get('location'), '/admin/collections/channels/3')
  const saved = d1.rows.get('INSERT INTO youtube_credentials')!
  assert.equal(saved[1], 'UCrawkode')
  assert.equal(await decryptToken(key, String(saved[2]), '3'), 'refresh-secret')
  assert.deepEqual(ok.updates[0].context, { youtubeConnect: true })
  assert.equal(ok.updates[0].data.streamId, 'stream-new')

  const wrong = fakePayload({ channels: [{ id: 3, youtubeChannelId: 'UCsomeoneelse', streamId: 's' }] })
  assert.equal((await finishConnect(callback(nonce!), wrong.payload, env, google().fetcher, now)).status, 409)
  assert.equal(wrong.updates.length, 0)

  const customer = fakePayload({ channels: [{ id: 3 }] }, { collection: 'users', role: 'customer', id: 2 })
  assert.equal((await beginConnect(new Request('https://admin.rawkode.academy/api/youtube/connect?channel=3'), customer.payload, env, now)).status, 401)
})
