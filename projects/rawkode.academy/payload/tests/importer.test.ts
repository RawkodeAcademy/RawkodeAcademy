import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout } from 'node:timers/promises'
import type { Payload } from 'payload'
import { importCatalogue, type ImportSnapshot } from '../src/importer'

type Document = Record<string, unknown> & { id: string }
const user = { id: 'import-test', collection: 'users', role: 'staff' } as never

function snapshot(): ImportSnapshot {
  return {
    sourceSystem: 'test', mappingVersion: '1', sequence: 1,
    records: [
      ...Array.from({ length: 9 }, (_, index) => ({ collection: 'people' as const, legacyId: `person-${index}`, slug: `person-${index}`, sourceRevision: '1', status: 'published' as const, data: { name: `Person ${index}` } })),
      { collection: 'videos', legacyId: 'abcdefghijklmnopqrstuvwx', slug: 'video', sourceRevision: '1', status: 'published', data: { title: 'Video' }, relationships: { guests: [{ collection: 'people', legacyId: 'person-1' }, { collection: 'people', legacyId: 'person-0' }] } },
    ],
  }
}

function harness(expectedNodes: number) {
  const documents = new Map<string, Document>()
  let active = 0, maximum = 0, writes = 0, publications = 0
  let failIdentity: string | undefined
  let failPhase = 'pending'
  const write = async (collection: string, data: Record<string, unknown>, id: string) => {
    active += 1
    maximum = Math.max(maximum, active)
    writes += 1
    try {
      if (data.legacyId === failIdentity && failIdentity !== undefined && data.importState === failPhase) throw new Error('Interrupted write')
      await setTimeout(3)
      if (data.importState === 'complete') {
        assert.equal(documents.size, expectedNodes, 'publication started before every node was staged')
        publications += 1
      }
      const key = `${collection}:${id}`
      const document = { ...documents.get(key), ...data, id }
      documents.set(key, document)
      return structuredClone(document)
    } finally { active -= 1 }
  }
  const payload = {
    async find({ collection, where }: { collection: string; where: Record<string, { equals: unknown }> }) {
      if (collection === 'deletion-markers') return { docs: [] }
      const [field, condition] = Object.entries(where)[0]!
      return { docs: [...documents.entries()].filter(([key, doc]) => key.startsWith(`${collection}:`) && doc[field] === condition.equals).map(([, doc]) => structuredClone(doc)) }
    },
    async create({ collection, data }: { collection: string; data: Record<string, unknown> }) { return write(collection, data, String(data.id)) },
    async update({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: string }) { return write(collection, data, id) },
  } as unknown as Payload
  return { payload, documents, interrupt(identity?: string, phase = 'pending') { failIdentity = identity; failPhase = phase }, stats: () => ({ active, maximum, writes, publications }) }
}

for (const concurrency of [undefined, 4]) {
  test(`import ${concurrency === undefined ? 'defaults to sequential writes' : 'batches independent writes'} and preserves phase barriers and identities`, async () => {
    const input = snapshot()
    const h = harness(input.records.length)
    const result = await importCatalogue(h.payload, user, input, { concurrency })
    assert.equal(result.counts.created, input.records.length)
    assert.equal(result.conflicts.length, 0)
    assert.equal(result.unresolved.length, 0)
    assert.equal(h.stats().maximum, concurrency ?? 1)
    const people = [...h.documents.values()].filter(doc => typeof doc.legacyId === 'string')
    const video = h.documents.get('videos:abcdefghijklmnopqrstuvwx')
    assert.equal(video?.sourceOrder, 9)
    assert.deepEqual(video?.guests, ['person-1', 'person-0'].map(legacyId => people.find(doc => doc.legacyId === legacyId)?.id))
    for (const document of h.documents.values()) assert.equal(document.importState, 'complete')
    const writes = h.stats().writes
    const retry = await importCatalogue(h.payload, user, input, { concurrency })
    assert.equal(retry.counts.unchanged, input.records.length)
    assert.equal(h.stats().writes, writes)
  })
}

test('an interrupted batch drains in-flight writes and resumes pending nodes without changing their IDs', async () => {
  const input = snapshot()
  const h = harness(input.records.length)
  h.interrupt('person-0')
  await assert.rejects(importCatalogue(h.payload, user, input, { concurrency: 4 }), /Interrupted write/)
  assert.equal(h.stats().active, 0)
  assert.equal(h.stats().publications, 0)
  assert.equal(h.documents.size, 3)
  const staged = [...h.documents.entries()]
  h.interrupt()
  const retry = await importCatalogue(h.payload, user, input, { concurrency: 4 })
  assert.equal(retry.counts.created + retry.counts.updated, input.records.length)
  assert.equal(retry.conflicts.length, 0)
  for (const [key, document] of staged) assert.equal(h.documents.get(key)?.id, document.id)
  assert.equal(h.stats().active, 0)
})

test('an interrupted publication batch leaves complete and pending nodes safe to resume', async () => {
  const input = snapshot()
  const h = harness(input.records.length)
  h.interrupt('person-0', 'complete')
  await assert.rejects(importCatalogue(h.payload, user, input, { concurrency: 4 }), /Interrupted write/)
  assert.equal(h.stats().active, 0)
  assert.equal(h.documents.size, input.records.length)
  assert.equal(h.stats().publications, 3)
  h.interrupt()
  const retry = await importCatalogue(h.payload, user, input, { concurrency: 4 })
  assert.equal(retry.counts.unchanged, 3)
  assert.equal(retry.counts.updated, input.records.length - 3)
  for (const document of h.documents.values()) assert.equal(document.importState, 'complete')
})

test('unresolved relationships remain pending when other batched nodes publish', async () => {
  const input = snapshot()
  const video = input.records.find(record => record.collection === 'videos')!
  video.relationships = { guests: [{ collection: 'people', legacyId: 'missing' }] }
  const h = harness(input.records.length)
  const result = await importCatalogue(h.payload, user, input, { concurrency: 4 })
  assert.equal(result.counts.pending, 1)
  assert.equal(result.unresolved.length, 1)
  assert.equal(h.documents.get('videos:abcdefghijklmnopqrstuvwx')?.importState, 'pending')
  assert.equal(h.stats().publications, input.records.length - 1)
})

test('batched retries retain editorial conflict protection', async () => {
  const input = snapshot()
  const h = harness(input.records.length)
  await importCatalogue(h.payload, user, input, { concurrency: 4 })
  const edited = [...h.documents.values()].find(doc => doc.legacyId === 'person-0')!
  edited.locallyEdited = true
  edited.name = 'Editorial title'
  const result = await importCatalogue(h.payload, user, input, { concurrency: 4 })
  assert.equal(result.counts.conflicts, 1)
  assert.equal(edited.name, 'Editorial title')
})

test('invalid concurrency is rejected before any writes', async () => {
  for (const concurrency of [0, 9, 1.5, Infinity]) {
    const h = harness(10)
    await assert.rejects(importCatalogue(h.payload, user, snapshot(), { concurrency }), /concurrency/)
    assert.equal(h.stats().writes, 0)
  }
})
