import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'

// The website builds these collections from Payload at build time
// (website/scripts/payload-content), so publishing one must rebuild the site.
export const siteCollections = ['videos', 'shows', 'people', 'technologies', 'chapters', 'learning-resources'] as const

export type SiteRebuildEnvironment = {
  SITE_REBUILD_ON_PUBLISH?: string
  SITE_REBUILD_GITHUB_TOKEN?: string
}

export type SiteRebuild = (reason: string) => Promise<void>

const repository = 'rawkode-academy/rawkode-academy'
// Generated from the website env.cue `content` pipeline; it always deploys.
const workflow = 'rawkode-academy-website-content.yml'

// Returns null when rebuilds are off, so nothing is dispatched before the
// website reads Payload (ACADEMY_CONTENT_SOURCE=payload).
export function siteRebuildFrom(env: SiteRebuildEnvironment, fetcher: typeof fetch = fetch): SiteRebuild | null {
  if (env.SITE_REBUILD_ON_PUBLISH !== 'true') return null
  const token = env.SITE_REBUILD_GITHUB_TOKEN
  if (!token) {
    // Keep the CMS up; publishing still works, the site just isn't rebuilt.
    console.error('SITE_REBUILD_ON_PUBLISH is on but SITE_REBUILD_GITHUB_TOKEN is not set; site rebuilds are disabled')
    return null
  }
  return async reason => {
    const response = await fetcher(`https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`, {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'rawkode-academy-payload',
        'x-github-api-version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'main', inputs: { reason: reason.slice(0, 200) } }),
    })
    if (!response.ok) throw new Error(`Site rebuild dispatch failed: ${response.status} ${await response.text()}`)
  }
}

const isPublished = (doc: unknown) => (doc as { _status?: unknown } | undefined)?._status === 'published'

// A save rebuilds the site when the public version changed: publishing,
// unpublishing, or editing something already published. Draft saves and the
// bulk importer (one operator-triggered rebuild afterwards) do not.
export function siteRebuildHooks(slug: string, rebuild: SiteRebuild): NonNullable<CollectionConfig['hooks']> {
  const trigger = async (req: { context: Record<string, unknown>; payload: { logger: { error: (value: unknown) => void } } }, doc: unknown, reason: string) => {
    if (req.context.importing === true || req.context.siteRebuildQueued === true) return
    req.context.siteRebuildQueued = true
    try {
      await rebuild(reason)
    } catch (error) {
      // Never fail the editor's save over the rebuild; the next publish retries.
      req.payload.logger.error({ msg: 'Site rebuild dispatch failed', collection: slug, legacyId: (doc as { legacyId?: unknown })?.legacyId, error: String(error) })
    }
  }
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (isPublished(doc)) {
      await trigger(req as never, doc, `payload: ${slug} ${doc.legacyId ?? doc.id} published`)
      return doc
    }
    if (!isPublished(previousDoc)) return doc
    // A draft saved over a published record leaves the public version in place;
    // only an unpublish changes it. The stored main record tells them apart.
    const current = await req.payload.findByID({ collection: slug as never, id: doc.id, draft: false, depth: 0, overrideAccess: true, req }).catch(() => null)
    if (!isPublished(current)) await trigger(req as never, doc, `payload: ${slug} ${doc.legacyId ?? doc.id} unpublished`)
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (isPublished(doc)) await trigger(req as never, doc, `payload: ${slug} ${doc.legacyId ?? doc.id} deleted`)
    return doc
  }
  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}

export function withSiteRebuild(config: CollectionConfig, rebuild: SiteRebuild | null): CollectionConfig {
  if (!rebuild || !(siteCollections as readonly string[]).includes(config.slug)) return config
  const hooks = siteRebuildHooks(config.slug, rebuild)
  return {
    ...config,
    hooks: {
      ...config.hooks,
      afterChange: [...(config.hooks?.afterChange ?? []), ...hooks.afterChange!],
      afterDelete: [...(config.hooks?.afterDelete ?? []), ...hooks.afterDelete!],
    },
  }
}
