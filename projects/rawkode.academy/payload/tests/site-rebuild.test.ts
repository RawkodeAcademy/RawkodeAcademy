import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createCollections } from '../src/collections'
import { siteCollections, siteRebuildFrom, siteRebuildHooks } from '../src/site-rebuild'

const request = (overrides: { stored?: unknown; context?: Record<string, unknown> } = {}) => {
  const errors: unknown[] = []
  return {
    errors,
    req: {
      context: overrides.context ?? {},
      payload: {
        logger: { error: (value: unknown) => errors.push(value) },
        findByID: async () => overrides.stored ?? { _status: 'published' },
      },
    },
  }
}

function harness(fail = false) {
  const reasons: string[] = []
  const hooks = siteRebuildHooks('videos', async reason => {
    if (fail) throw new Error('GitHub is down')
    reasons.push(reason)
  })
  const change = (doc: Record<string, unknown>, previousDoc: Record<string, unknown> | undefined, req: unknown) =>
    hooks.afterChange![0]!({ doc, previousDoc, req, operation: 'update', collection: {}, context: {}, data: {} } as never)
  const remove = (doc: Record<string, unknown>, req: unknown) =>
    hooks.afterDelete![0]!({ doc, req, id: doc.id, collection: {}, context: {} } as never)
  return { reasons, change, remove }
}

test('publishing, unpublishing and deleting published content rebuild the site', async () => {
  const { reasons, change, remove } = harness()
  await change({ id: 1, legacyId: 'abc', _status: 'published' }, { _status: 'draft' }, request().req)
  await change({ id: 1, legacyId: 'abc', _status: 'published' }, { _status: 'published' }, request().req)
  await change({ id: 1, legacyId: 'abc', _status: 'draft' }, { _status: 'published' }, request({ stored: { _status: 'draft' } }).req)
  await remove({ id: 1, legacyId: 'abc', _status: 'published' }, request().req)
  assert.deepEqual(reasons, ['payload: videos abc published', 'payload: videos abc published', 'payload: videos abc unpublished', 'payload: videos abc deleted'])
})

test('drafts, imports and repeat saves in one request do not rebuild', async () => {
  const { reasons, change, remove } = harness()
  await change({ id: 1, _status: 'draft' }, { _status: 'draft' }, request().req)
  // A draft saved over a published record leaves the public version as it was.
  await change({ id: 1, _status: 'draft' }, { _status: 'published' }, request({ stored: { _status: 'published' } }).req)
  await change({ id: 1, _status: 'published' }, undefined, request({ context: { importing: true } }).req)
  await remove({ id: 1, _status: 'draft' }, request().req)
  const shared = request().req
  await change({ id: 1, _status: 'published' }, undefined, shared)
  await change({ id: 2, _status: 'published' }, undefined, shared)
  assert.equal(reasons.length, 1)
})

test('a failed dispatch never fails the save', async () => {
  const { change } = harness(true)
  const { req, errors } = request()
  const doc = { id: 1, legacyId: 'abc', _status: 'published' }
  assert.equal(await change(doc, undefined, req), doc)
  assert.equal(errors.length, 1)
})

test('rebuilds are off unless switched on with a token', async () => {
  assert.equal(siteRebuildFrom({}), null)
  assert.equal(siteRebuildFrom({ SITE_REBUILD_ON_PUBLISH: 'false', SITE_REBUILD_GITHUB_TOKEN: 't' }), null)
  assert.equal(siteRebuildFrom({ SITE_REBUILD_ON_PUBLISH: 'true' }), null)
  const calls: { url: string; init: RequestInit }[] = []
  const rebuild = siteRebuildFrom({ SITE_REBUILD_ON_PUBLISH: 'true', SITE_REBUILD_GITHUB_TOKEN: 'secret' }, (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(null, { status: 204 })
  }) as never)!
  await rebuild('payload: people ada published')
  assert.equal(calls[0]!.url, 'https://api.github.com/repos/rawkode-academy/rawkode-academy/actions/workflows/rawkode-academy-website-content.yml/dispatches')
  assert.equal((calls[0]!.init.headers as Record<string, string>).authorization, 'Bearer secret')
  assert.deepEqual(JSON.parse(String(calls[0]!.init.body)), { ref: 'main', inputs: { reason: 'payload: people ada published' } })
  const failing = siteRebuildFrom({ SITE_REBUILD_ON_PUBLISH: 'true', SITE_REBUILD_GITHUB_TOKEN: 'secret' }, (async () => new Response('nope', { status: 403 })) as never)!
  await assert.rejects(failing('x'), /403 nope/)
})

test('only the collections the website builds from carry the hooks', () => {
  const count = (rebuild: (() => Promise<void>) | null) => new Map(createCollections({ localAuth: false } as never, {} as never, undefined, rebuild)
    .map(collection => [collection.slug, (collection.hooks?.afterChange?.length ?? 0) + (collection.hooks?.afterDelete?.length ?? 0)]))
  const without = count(null)
  const withRebuild = count(async () => {})
  for (const [slug, hooks] of withRebuild)
    assert.equal(hooks - without.get(slug)!, (siteCollections as readonly string[]).includes(slug) ? 2 : 0, slug)
})
