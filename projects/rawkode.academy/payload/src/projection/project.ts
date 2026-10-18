import type { Payload } from 'payload'
import { type ContentEntry, type DocIndex, entryFor, type OwnedCollection, ownedCollections, type PayloadDoc, type Warnings } from './entries'

// KV layout: one value per collection holding every published entry, the way
// a content collection did. The website reads a collection with one KV get.
export const contentKey = (collection: OwnedCollection) => `content:v1:${collection}`

export type ProjectedCollection = { collection: OwnedCollection; projectedAt: string; entries: ContentEntry[] }

// What each collection's entries reference, so the index can resolve legacy ids.
const dependencies: Record<OwnedCollection, string[]> = {
  videos: ['videos', 'people', 'technologies', 'shows', 'chapters'],
  shows: ['shows', 'people'],
  people: ['people'],
  technologies: ['technologies', 'learning-resources'],
}

// Supporting records live inside their owner's entries.
export const ownerOf: Record<string, OwnedCollection> = {
  videos: 'videos', shows: 'shows', people: 'people', technologies: 'technologies',
  chapters: 'videos', 'learning-resources': 'technologies',
}

export const isOwnedCollection = (value: unknown): value is OwnedCollection =>
  typeof value === 'string' && (ownedCollections as readonly string[]).includes(value)

export type PublishedSource = (collection: string) => Promise<PayloadDoc[]>

// Published, non-tombstoned records exactly as anonymous readers see them.
export const publishedFrom = (payload: Payload): PublishedSource => async collection => {
  const result = await payload.find({
    collection: collection as never, depth: 0, draft: false, pagination: false, overrideAccess: true,
    where: { and: [{ _status: { equals: 'published' } }, { tombstone: { equals: false } }] },
  })
  return result.docs as unknown as PayloadDoc[]
}

export async function projectCollection(collection: OwnedCollection, published: PublishedSource, now = new Date()): Promise<ProjectedCollection & { warnings: Warnings }> {
  const index: DocIndex = new Map()
  for (const name of dependencies[collection]) {
    index.set(name, new Map((await published(name)).map(doc => [String(doc.id), doc])))
  }
  const warnings: Warnings = []
  const entries = [...index.get(collection)!.values()]
    .map(doc => entryFor(collection, doc, index, warnings))
    .sort((left, right) => left.id.localeCompare(right.id))
  const seen = new Set<string>()
  for (const entry of entries) {
    if (seen.has(entry.id)) warnings.push(`${collection}: duplicate entry id ${entry.id}`)
    seen.add(entry.id)
  }
  return { collection, projectedAt: now.toISOString(), entries, warnings }
}

export async function writeProjection(kv: KVNamespace, projected: ProjectedCollection): Promise<void> {
  const { collection, projectedAt, entries } = projected
  await kv.put(contentKey(collection), JSON.stringify({ collection, projectedAt, entries }))
}

// Edge cache tags to purge when a collection's public content changes. They
// match the Cache-Tag headers the website sets; detail tags are coarse on
// purpose, because pages embed names and titles from other collections.
export const purgeTags: Record<OwnedCollection, string[]> = {
  videos: ['homepage', 'videos-list', 'video-detail', 'video-markdown', 'shows-list', 'show-detail', 'person-detail', 'technology-detail'],
  shows: ['homepage', 'shows-list', 'show-detail', 'video-detail'],
  people: ['person-detail', 'people-list', 'video-detail', 'show-detail'],
  technologies: ['technology-detail', 'technologies-list', 'video-detail'],
}
