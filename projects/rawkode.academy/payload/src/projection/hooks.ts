import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import type { OwnedCollection } from './entries'
import { ownerOf } from './project'
import type { ProjectionParams } from './run'

export type ProjectionQueue = { create(options: { params: ProjectionParams }): Promise<unknown> }
export type QueueLoader = () => Promise<ProjectionQueue | undefined>

const isPublished = (doc: unknown) => (doc as { _status?: unknown } | undefined)?._status === 'published'

type HookRequest = {
  context: Record<string, unknown>
  payload: { logger: { error: (value: unknown) => void }; findByID: (args: Record<string, unknown>) => Promise<unknown> }
}

// Starts a projection whenever the public version of a record changes:
// publishing, unpublishing, editing something published, or deleting it.
// Draft saves and the bulk importer do not; after an import, run a rebuild.
export function projectionHooks(slug: string, loadQueue: QueueLoader): NonNullable<CollectionConfig['hooks']> {
  const owner: OwnedCollection = ownerOf[slug]!
  const enqueue = async (req: HookRequest, doc: Record<string, unknown>, change: string) => {
    if (req.context.importing === true) return
    const queued = (req.context.projectionQueued ??= new Set<string>()) as Set<string>
    if (queued.has(owner)) return
    queued.add(owner)
    const publishedAt = typeof doc.publishedAt === 'string' ? doc.publishedAt : undefined
    const releaseAt = owner === 'videos' && publishedAt && Date.parse(publishedAt) > Date.now() ? publishedAt : undefined
    try {
      const queue = await loadQueue()
      if (!queue) return
      await queue.create({ params: { collections: [owner], reason: `${slug} ${doc.legacyId ?? doc.id} ${change}`, ...(releaseAt ? { releaseAt } : {}) } })
    } catch (error) {
      // Never fail the editor's save; the next publish or a rebuild catches up.
      req.payload.logger.error({ msg: 'Projection could not be queued', collection: slug, id: doc.id, error: String(error) })
    }
  }
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (isPublished(doc)) {
      await enqueue(req as never, doc, 'published')
      return doc
    }
    if (!isPublished(previousDoc)) return doc
    // A draft saved over a published record leaves the public version as it was.
    const current = await req.payload.findByID({ collection: slug as never, id: doc.id, draft: false, depth: 0, overrideAccess: true, req }).catch(() => null)
    if (!isPublished(current)) await enqueue(req as never, doc, 'unpublished')
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (isPublished(doc)) await enqueue(req as never, doc, 'deleted')
    return doc
  }
  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}

export function withProjection(config: CollectionConfig, loadQueue: QueueLoader): CollectionConfig {
  if (!(config.slug in ownerOf)) return config
  const hooks = projectionHooks(config.slug, loadQueue)
  return {
    ...config,
    hooks: {
      ...config.hooks,
      afterChange: [...(config.hooks?.afterChange ?? []), ...hooks.afterChange!],
      afterDelete: [...(config.hooks?.afterDelete ?? []), ...hooks.afterDelete!],
    },
  }
}

// Production loads the Workflow binding lazily so tooling can import collections.
export const workflowQueue: QueueLoader = async () =>
  ((await import('../cloudflare')).cloudflare.env as unknown as { PROJECTION_WORKFLOW?: ProjectionQueue }).PROJECTION_WORKFLOW
