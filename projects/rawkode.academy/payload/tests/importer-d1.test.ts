import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { buildConfig, getPayload, type Migration, type Payload } from 'payload'
import { getPlatformProxy } from 'wrangler'
import { createCollections } from '../src/collections'
import { createCuid2 } from '../src/cuid2'
import { experimentalD1Adapter } from '../src/d1-adapter'
import { importCatalogue, type ImportSnapshot } from '../src/importer'
import { migrations } from '../src/migrations-cuid2'

test('real Payload/D1 recovers a committed base row when its first version INSERT loses the connection', { timeout: 180_000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'payload-import-d1-'))
  const configPath = path.join(directory, 'wrangler.json')
  // This fixture has only an ephemeral local D1 binding; no project config,
  // credentials, remote resources, R2, or production data are involved.
  await writeFile(configPath, JSON.stringify({ name: 'payload-import-test', compatibility_date: '2026-03-12', d1_databases: [{ binding: 'D1', database_name: 'import-test', database_id: '00000000-0000-0000-0000-000000000001' }] }))
  const proxy = await getPlatformProxy<{ D1: D1Database }>({ configPath, persist: false, remoteBindings: false })
  let payload: Awaited<ReturnType<typeof getPayload>> | undefined
  try {
    const config = buildConfig({
      secret: 'ephemeral-import-test-only',
      db: experimentalD1Adapter({ binding: proxy.env.D1, push: false, idType: 'number', allowIDOnCreate: true }),
      collections: createCollections({ localAuth: false } as never, proxy.env.D1),
      typescript: { autoGenerate: false, outputFile: path.join(directory, 'payload-types.ts') },
      admin: { importMap: { autoGenerate: false } },
    })
    payload = await getPayload({ config, disableOnInit: true })
    await payload.db.migrate({ migrations: migrations as unknown as Migration[] })
    const user = { id: createCuid2(), collection: 'users', role: 'staff' } as never
    const videoID = createCuid2()
    const snapshot: ImportSnapshot = { sourceSystem: 'd1-regression', mappingVersion: '1', sequence: 1, records: [
      { collection: 'chapters', legacyId: 'chapter', slug: 'chapter', sourceRevision: '1', status: 'published', data: { title: 'Chapter', startTime: 0 } },
      { collection: 'videos', legacyId: videoID, slug: 'video', sourceRevision: '1', status: 'published', data: { title: 'Video', type: 'recorded', publishedAt: '2026-01-01T00:00:00Z' }, relationships: { chapters: [{ collection: 'chapters', legacyId: 'chapter' }] } },
    ] }
    const originalVersion = payload.db.createVersion
    let durableID: string | undefined
    payload.db.createVersion = (async function(this: Payload['db'], args: Parameters<Payload['db']['createVersion']>[0]) {
      if (!durableID && args.collectionSlug === 'chapters') {
        durableID = String(args.parent)
        const base = await proxy.env.D1.prepare('SELECT id FROM chapters WHERE legacy_id = ?').bind('chapter').first<{ id: string }>()
        assert.equal(base?.id, durableID, 'base INSERT committed before version creation')
        const versions = await proxy.env.D1.prepare('SELECT count(*) AS n FROM _chapters_v WHERE parent_id = ?').bind(durableID).first<{ n: number }>()
        assert.equal(versions?.n, 0, 'the first version is still absent')
        throw new Error('D1_ERROR: Network connection lost.')
      }
      return originalVersion.call(this, args)
    }) as Payload['db']['createVersion']
    const result = await importCatalogue(payload, user, snapshot, { retryTransientD1: true })
    payload.db.createVersion = originalVersion
    assert.ok(durableID)
    assert.equal(result.counts.created + result.counts.updated, 2)
    assert.equal(result.counts.conflicts, 0)
    assert.equal(result.counts.pending, 0)
    const chapters = await payload.find({ collection: 'chapters', draft: true, depth: 0, overrideAccess: false, user })
    assert.equal(chapters.docs.length, 1)
    assert.equal(chapters.docs[0]?.id, durableID)
    assert.equal(chapters.docs[0]?.importState, 'complete')
    assert.equal(chapters.docs[0]?._status, 'published')
    const video = await payload.findByID({ collection: 'videos', id: videoID, depth: 0, draft: true, overrideAccess: false, user })
    assert.deepEqual(video.chapters, [durableID])
    assert.equal((await importCatalogue(payload, user, snapshot)).counts.unchanged, 2)
    const versions = await proxy.env.D1.prepare('SELECT count(*) AS n FROM _chapters_v WHERE parent_id = ? AND latest = 1').bind(durableID).first<{ n: number }>()
    assert.equal(versions?.n, 1, 'recovery leaves one canonical latest version')
  } finally {
    try { await payload?.destroy() } finally {
      await proxy.dispose()
      await rm(directory, { recursive: true, force: true })
    }
  }
})
