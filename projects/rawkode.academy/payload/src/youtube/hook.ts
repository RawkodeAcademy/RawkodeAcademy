import type { CollectionAfterChangeHook, Payload } from 'payload'
import { type ChannelTarget, desiredFor, desiredHash, type VideoSnapshot } from './plan'
import { YouTubeStore } from './store'
import type { SyncParams } from './sync'

type SyncEnv = { D1: D1Database; YOUTUBE_SYNC_WORKFLOW?: { create(options: { id: string; params: SyncParams }): Promise<unknown> } }

const ids = (value: unknown): number[] => (Array.isArray(value) ? value : value == null ? [] : [value])
  .map(item => Number(item && typeof item === 'object' ? (item as { id?: unknown }).id : item))
  .filter(Number.isSafeInteger)

async function byIds<T>(payload: Payload, collection: string, list: number[]): Promise<T[]> {
  if (!list.length) return []
  const found = await payload.find({ collection: collection as never, where: { id: { in: list } }, depth: 0, limit: list.length, pagination: false, overrideAccess: true })
  const index = new Map(found.docs.map(doc => [Number((doc as { id: unknown }).id), doc as T]))
  return list.map(id => index.get(id)).filter((doc): doc is T => Boolean(doc))
}

export async function snapshotFor(payload: Payload, doc: Record<string, any>): Promise<{ video: VideoSnapshot; channels: ChannelTarget[] }> {
  const [technologies, chapters, channels] = await Promise.all([
    byIds<{ name?: string }>(payload, 'technologies', ids(doc.technologies)),
    byIds<{ title?: string; startTime?: number }>(payload, 'chapters', ids(doc.chapters)),
    byIds<Record<string, any>>(payload, 'channels', ids(doc.channels)),
  ])
  const terms = Array.isArray(doc.terms) ? doc.terms.map((row: { value?: string }) => row?.value ?? '') : []
  return {
    video: {
      id: Number(doc.id), legacyId: String(doc.legacyId), slug: String(doc.slug ?? doc.legacyId),
      title: String(doc.title ?? ''), description: String(doc.description ?? ''),
      type: doc.type === 'live' || doc.type === 'recorded' ? doc.type : null,
      publishedAt: doc.publishedAt ?? null, duration: typeof doc.duration === 'number' ? doc.duration : null,
      youtubeId: doc.youtubeId || null,
      tags: [...technologies.map(technology => technology.name ?? ''), ...terms].filter(Boolean),
      chapters: chapters.map(chapter => ({ title: String(chapter.title ?? ''), startTime: Number(chapter.startTime ?? 0) })),
    },
    channels: channels.filter(channel => channel.connection === 'connected' && channel.youtubeChannelId).map(channel => ({
      id: Number(channel.id), youtubeChannelId: String(channel.youtubeChannelId), streamId: channel.streamId || null,
      privacy: ['public', 'unlisted', 'private'].includes(channel.privacy) ? channel.privacy : 'public',
    })),
  }
}

export async function scheduleSync(payload: Payload, doc: Record<string, any>, env: SyncEnv): Promise<string[]> {
  if (!env.YOUTUBE_SYNC_WORKFLOW) return []
  const { video, channels } = await snapshotFor(payload, doc)
  if (!channels.length) return []
  const state = await new YouTubeStore(env.D1).syncState(video.id)
  const desired = desiredFor(video)
  const started: string[] = []
  for (const channel of channels) {
    const hash = await desiredHash(desired, channel)
    const previous = state[String(channel.id)]
    if (previous?.syncedHash === hash && previous.state !== 'error') continue
    const id = `yt-${video.id}-${channel.id}-${hash}`
    try {
      await env.YOUTUBE_SYNC_WORKFLOW.create({ id, params: { video, channel, desired, hash } })
      started.push(id)
    } catch (error) {
      // Same content already queued or running.
      if (!/already exists/i.test(String(error))) throw error
    }
  }
  return started
}

// Publishing a video with channels selected queues a one-way sync to each.
// Draft saves never touch YouTube, and a failure never fails the save.
export const youtubeSyncHook = (loadEnv: () => Promise<SyncEnv> = async () => (await import('../cloudflare')).cloudflare.env as unknown as SyncEnv): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    if (doc._status !== 'published' || req.context.importing === true || !ids(doc.channels).length) return doc
    try {
      await scheduleSync(req.payload, doc, await loadEnv())
    } catch (error) {
      req.payload.logger.error({ msg: 'YouTube sync could not be queued', video: doc.id, error: String(error) })
    }
    return doc
  }
