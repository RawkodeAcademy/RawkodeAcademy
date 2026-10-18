import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import matter from 'gray-matter'
import { buildStaticSnapshot } from '../src/static-content'
import { cleanReference, type ContentEntry, ownedCollections, type PayloadDoc } from '../src/projection/entries'
import { projectionHooks } from '../src/projection/hooks'
import { contentKey, projectCollection, type PublishedSource, writeProjection } from '../src/projection/project'
import { purgeCacheTags } from '../src/projection/purge'
import { runProjection, type ProjectionStep } from '../src/projection/run'

const contentRoot = path.resolve(import.meta.dirname, '../../../../content')
type Docs = Record<string, PayloadDoc[]>

// The checked-in content shaped the way Payload serves it after the static
// import: numeric ids, depth-0 relationships, row ids on arrays.
async function simulatePayload(): Promise<{ docs: Docs; paths: Map<string, string> }> {
  const snapshot = await buildStaticSnapshot({ root: contentRoot })
  const wanted = [...ownedCollections, 'chapters', 'learning-resources', 'episodes']
  const records = snapshot.records.filter(record => wanted.includes(record.collection))
  const ids = new Map(records.map((record, index) => [`${record.collection}:${record.legacyId}`, index + 1]))
  const idOf = (reference: { collection: string; legacyId: string }) => ids.get(`${reference.collection}:${reference.legacyId}`)!
  let row = 0
  const withRowIds = (value: unknown) => Array.isArray(value) ? value.map(item => item && typeof item === 'object' ? { ...item, id: `row-${++row}` } : item) : value
  const docs: Docs = Object.fromEntries(wanted.map(name => [name, []]))
  const paths = new Map<string, string>()
  for (const record of records) {
    const data: Record<string, unknown> = { title: null, description: null, tagline: null, ...record.data }
    for (const key of ['terms', 'whatYouWillLearn', 'aliases', 'features', 'relatedTechnologies', 'useCases', 'links', 'official', 'community', 'tutorials']) if (key in data) data[key] = withRowIds(data[key])
    const relationships = Object.fromEntries(Object.entries(record.relationships ?? {}).map(([field, value]) => [field, Array.isArray(value) ? value.map(idOf) : value ? idOf(value) : null]))
    docs[record.collection]!.push({
      ...data, ...relationships, id: idOf(record), legacyId: record.legacyId, slug: record.slug,
      sourcePath: record.source?.path ?? null, sourceData: record.source?.data ?? null, locallyEdited: false, _status: 'published',
    } as PayloadDoc)
    if (record.source?.path && (ownedCollections as readonly string[]).includes(record.collection)) paths.set(`${record.collection}:${record.legacyId}`, record.source.path)
  }
  return { docs, paths }
}

const sourceOf = (docs: Docs): PublishedSource => async collection => docs[collection] ?? []
const edited = (docs: Docs): Docs => Object.fromEntries(Object.entries(docs).map(([name, list]) => [name, (ownedCollections as readonly string[]).includes(name) ? list.map(doc => ({ ...doc, locallyEdited: true })) : list]))

// How the website's collection schemas read an entry: references by id, dates as instants.
function comparable(data: Record<string, unknown>, body: string | undefined) {
  const normalised = JSON.parse(JSON.stringify(data)) as Record<string, unknown>
  for (const field of ['technologies', 'guests', 'show', 'hosts']) {
    const value = normalised[field]
    if (Array.isArray(value)) normalised[field] = value.map(cleanReference)
    else if (value !== undefined) normalised[field] = cleanReference(value)
  }
  return { data: normalised, body: (body ?? '').replace(/^(?:\r?\n)+/, '') }
}

// The id Astro's glob loader gave each entry: the slug when set, else the path.
const astroId = (collection: string, relativePath: string, data: Record<string, unknown>) => {
  if (typeof data.slug === 'string' && data.slug) return data.slug
  const inCollection = relativePath.replace(new RegExp(`^${collection}/`), '').replace(/\.(?:md|mdx)$/, '')
  return inCollection.endsWith('/index') ? inCollection.slice(0, -'/index'.length) : inCollection
}

let fixture: Awaited<ReturnType<typeof simulatePayload>>
const loadFixture = async () => (fixture ??= await simulatePayload())

async function assertMatchesGit(docs: Docs) {
  const { paths } = await loadFixture()
  for (const collection of ownedCollections) {
    const projected = await projectCollection(collection, sourceOf(docs))
    assert.deepEqual(projected.warnings, [], collection)
    const byId = new Map(projected.entries.map(entry => [entry.id, entry]))
    const files = [...paths].filter(([key]) => key.startsWith(`${collection}:`))
    assert.equal(projected.entries.length, files.length, `${collection} entry count`)
    for (const [, relative] of files) {
      const { data, content } = matter(await readFile(path.join(contentRoot, relative), 'utf8'))
      const entry = byId.get(astroId(collection, relative, data))
      assert.ok(entry, `${relative} has an entry under the id Astro used`)
      assert.deepEqual(comparable(entry.data, entry.body), comparable(data, content), relative)
    }
  }
}

test('unedited records project to the same entries the git files produced', async () => {
  await assertMatchesGit((await loadFixture()).docs)
})

test('records regenerated from Payload fields keep the same meaning', async () => {
  await assertMatchesGit(edited((await loadFixture()).docs))
})

test('editorial changes reach the entry, and unpublished references are dropped with a warning', async () => {
  const { docs } = await loadFixture()
  const changed = edited(docs)
  const salaboy = changed.people!.find(doc => doc.legacyId === 'salaboy')!
  const dapr = changed.videos!.find(doc => doc.slug === 'hands-on-introduction-to-dapr')!
  changed.videos = changed.videos!.map(doc => doc.id === dapr.id ? { ...doc, title: 'Dapr, hands on', tagline: '', guests: [salaboy.id, 99_999_999] } : doc)
  const projected = await projectCollection('videos', sourceOf(changed))
  const entry = projected.entries.find(item => item.id === 'hands-on-introduction-to-dapr')!
  assert.equal(entry.data.title, 'Dapr, hands on')
  assert.deepEqual(entry.data.guests, ['salaboy'])
  assert.equal('tagline' in entry.data, false)
  assert.match(projected.warnings.join('\n'), /dropped people 99999999, which is not published/)
})

test('a projection is one KV value per collection', async () => {
  const puts: [string, string][] = []
  const kv = { put: async (key: string, value: string) => { puts.push([key, value]) } } as unknown as KVNamespace
  const entries: ContentEntry[] = [{ id: 'klustered', data: { id: 'klustered', name: 'Klustered' } }]
  await writeProjection(kv, { collection: 'shows', projectedAt: '2026-10-18T00:00:00.000Z', entries })
  assert.equal(puts[0]![0], contentKey('shows'))
  assert.equal(contentKey('shows'), 'content:v1:shows')
  assert.deepEqual(JSON.parse(puts[0]![1]), { collection: 'shows', projectedAt: '2026-10-18T00:00:00.000Z', entries })
})

function recordingStep(): ProjectionStep & { log: string[] } {
  const log: string[] = []
  return {
    log,
    do: async (name, run) => { log.push(name); return run() },
    sleep: async (name, duration) => { log.push(`${name} (${duration})`) },
    sleepUntil: async (name, at) => { log.push(`${name} (${at.toISOString()})`) },
  }
}

test('the workflow projects, purges twice around KV settling, and again at release', async () => {
  const calls: { url: string; body: any }[] = []
  const fetcher = (async (url: string, init: RequestInit) => { calls.push({ url, body: JSON.parse(String(init.body)) }); return Response.json({ success: true }) }) as typeof fetch
  const step = recordingStep()
  const projected: string[] = []
  const now = Date.parse('2026-10-18T12:00:00.000Z')
  const result = await runProjection({
    project: async collection => { projected.push(collection); return { entries: 1, warnings: [] } },
    env: { CACHE_PURGE_TOKEN: 'token', CACHE_PURGE_ZONE_ID: 'zone' }, fetcher,
  }, { collections: ['videos'], reason: 'test', releaseAt: '2026-10-22T16:00:00.000Z' }, step, () => now)
  assert.deepEqual(projected, ['videos'])
  assert.deepEqual(step.log, ['project videos', 'purge cache', 'wait for KV to settle (75 seconds)', 'purge cache again', 'wait for release (2026-10-22T16:00:00.000Z)', 'purge cache at release'])
  assert.equal(calls.length, 3)
  assert.equal(calls[0]!.url, 'https://api.cloudflare.com/client/v4/zones/zone/purge_cache')
  assert.ok(calls[0]!.body.tags.includes('video-detail') && calls[0]!.body.tags.includes('homepage'))
  assert.equal(result.purge, 'purged')
})

test('without purge credentials the workflow still projects and skips the waits', async () => {
  const step = recordingStep()
  const result = await runProjection({ project: async () => ({ entries: 1, warnings: [] }), env: {} }, { collections: ['people', 'shows'], reason: 'test', releaseAt: '2020-01-01T00:00:00.000Z' }, step)
  assert.deepEqual(step.log, ['project people', 'project shows', 'purge cache'])
  assert.equal(result.purge, 'not-configured')
})

test('purges are batched by 100 tags and failures surface for retry', async () => {
  const bodies: string[][] = []
  const ok = (async (_url: string, init: RequestInit) => { bodies.push(JSON.parse(String(init.body)).tags); return Response.json({ success: true }) }) as typeof fetch
  await purgeCacheTags({ CACHE_PURGE_TOKEN: 't', CACHE_PURGE_ZONE_ID: 'z' }, Array.from({ length: 150 }, (_, i) => `tag-${i % 120}`), ok)
  assert.deepEqual(bodies.map(tags => tags.length), [100, 20])
  const denied = (async () => Response.json({ success: false, errors: [{ message: 'nope' }] }, { status: 403 })) as typeof fetch
  await assert.rejects(purgeCacheTags({ CACHE_PURGE_TOKEN: 't', CACHE_PURGE_ZONE_ID: 'z' }, ['a'], denied), /403/)
})

function hookHarness(fail = false) {
  const created: any[] = []
  const queue = { create: async (options: any) => { if (fail) throw new Error('down'); created.push(options.params) } }
  const errors: unknown[] = []
  const req = (stored: unknown = { _status: 'published' }, context: Record<string, unknown> = {}) => ({
    context, payload: { logger: { error: (value: unknown) => errors.push(value) }, findByID: async () => stored },
  })
  const run = async (slug: string, doc: Record<string, unknown>, previousDoc?: Record<string, unknown>, request = req()) =>
    projectionHooks(slug, async () => queue).afterChange![0]!({ doc, previousDoc, req: request } as never)
  const remove = async (slug: string, doc: Record<string, unknown>) => projectionHooks(slug, async () => queue).afterDelete![0]!({ doc, req: req() } as never)
  return { created, errors, run, remove, req }
}

test('publishing queues a projection of the owning collection, with the release time for upcoming streams', async () => {
  const { created, run, remove, req } = hookHarness()
  const future = new Date(Date.now() + 86_400_000).toISOString()
  await run('videos', { id: 1, legacyId: 'a', _status: 'published', publishedAt: future })
  await run('chapters', { id: 2, legacyId: 'a-chapter-0', _status: 'published' })
  await run('people', { id: 3, legacyId: 'salaboy', _status: 'draft' }, { _status: 'published' }, req({ _status: 'draft' }))
  await remove('learning-resources', { id: 4, legacyId: 'k8s', _status: 'published' })
  assert.deepEqual(created, [
    { collections: ['videos'], reason: 'videos a published', releaseAt: future },
    { collections: ['videos'], reason: 'chapters a-chapter-0 published' },
    { collections: ['people'], reason: 'people salaboy unpublished' },
    { collections: ['technologies'], reason: 'learning-resources k8s deleted' },
  ])
})

test('drafts, imports and repeat saves in one request do not queue; failures never fail the save', async () => {
  const { created, run, req } = hookHarness()
  await run('videos', { id: 1, _status: 'draft' })
  await run('videos', { id: 1, _status: 'draft' }, { _status: 'published' }, req({ _status: 'published' }))
  await run('videos', { id: 1, _status: 'published' }, undefined, req(undefined, { importing: true }))
  const shared = req()
  await run('videos', { id: 1, _status: 'published' }, undefined, shared)
  await run('chapters', { id: 2, _status: 'published' }, undefined, shared)
  assert.equal(created.length, 1)
  const failing = hookHarness(true)
  const doc = { id: 9, _status: 'published' }
  assert.equal(await failing.run('shows', doc), doc)
  assert.equal(failing.errors.length, 1)
})

test('only catalogue collections and their child records project', async () => {
  const { withProjection } = await import('../src/projection/hooks')
  const queue = async () => undefined
  for (const slug of ['videos', 'shows', 'people', 'technologies', 'chapters', 'learning-resources']) {
    const config = withProjection({ slug, fields: [] }, queue)
    assert.equal(config.hooks?.afterChange?.length, 1, slug)
    assert.equal(config.hooks?.afterDelete?.length, 1, slug)
  }
  for (const slug of ['articles', 'courses', 'seasons', 'users', 'media']) {
    const config = { slug, fields: [] }
    assert.equal(withProjection(config, queue), config, slug)
  }
})
