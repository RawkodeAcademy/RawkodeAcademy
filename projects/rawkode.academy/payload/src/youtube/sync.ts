import { bindBroadcast, type Fetcher, getBroadcast, getVideoSnippet, insertBroadcast, refreshAccessToken, rescheduleBroadcast, reschedulable, updateVideoSnippet, YouTubeError } from './api'
import { type Action, actionFor, type ChannelSyncState, type ChannelTarget, type Desired, type VideoSnapshot } from './plan'
import { decryptToken } from './secrets'
import type { YouTubeStore } from './store'

export type SyncParams = { video: VideoSnapshot; channel: ChannelTarget; desired: Desired; hash: string }

export type SyncDependencies = {
  store: Pick<YouTubeStore, 'credential' | 'record' | 'syncState'>
  fetcher: Fetcher
  tokenKey: string
  client: { clientId: string; clientSecret: string }
  now?: () => number
}

type RetryPolicy = { limit: number }
// Mirrors the subset of Cloudflare's WorkflowStep the sync uses.
export type Step = { do<T>(name: string, config: { retries: RetryPolicy }, run: () => Promise<T>): Promise<T> }

const retryable = { retries: { limit: 3 } }
// A retried insert after a lost response would create a second broadcast.
const once = { retries: { limit: 0 } }

const sameTags = (left: string[] | undefined, right: string[]) => JSON.stringify(left ?? []) === JSON.stringify(right)

// One-way sync for one (video, channel): the CMS is the source of truth.
// Each step reloads the refresh token, so no access token is ever checkpointed.
export async function runSync(deps: SyncDependencies, params: SyncParams, step: Step): Promise<ChannelSyncState> {
  const { video, channel, desired, hash } = params
  const accessToken = async () => {
    const credential = await deps.store.credential(channel.id)
    if (!credential) throw new YouTubeError(401, 'notConnected', 'Channel is not connected to YouTube')
    if (credential.youtubeChannelId !== channel.youtubeChannelId) throw new YouTubeError(409, 'channelMismatch', 'Stored credential belongs to a different YouTube channel; reconnect it')
    return refreshAccessToken(deps.fetcher, deps.client, await decryptToken(deps.tokenKey, credential.refreshToken, String(channel.id)))
  }
  // Workflows caches each step by name, so every write needs its own name.
  const record = (name: string, state: ChannelSyncState) => step.do(name, retryable, async () => {
    await deps.store.record(video.id, channel.id, { syncedAt: new Date(deps.now?.() ?? Date.now()).toISOString(), ...state })
    return state
  })

  try {
    // Read the stored state rather than the snapshot taken at publish time: an
    // earlier run may have created the broadcast since.
    const previous = await step.do('read sync state', retryable, async () => (await deps.store.syncState(video.id))[String(channel.id)] ?? null)
    const action: Action = actionFor(video, previous ?? undefined, deps.now?.())
    if (action.kind === 'unsupported') return await record('record unsupported', { state: 'unsupported', message: action.message, syncedHash: hash })

    let youtubeVideoId: string
    let created = false
    if (action.kind === 'create-broadcast') {
      if (!channel.streamId) throw new YouTubeError(409, 'noStream', 'Channel has no reusable stream; reconnect it')
      youtubeVideoId = await step.do('create broadcast', once, async () => insertBroadcast(deps.fetcher, await accessToken(), {
        title: desired.title, description: desired.description, scheduledStartTime: desired.scheduledStartTime!,
        ...(desired.scheduledEndTime ? { scheduledEndTime: desired.scheduledEndTime } : {}), privacyStatus: channel.privacy,
      }))
      created = true
      // Persist the id before anything else can fail, so a re-run updates
      // this broadcast instead of creating another.
      await record('record new broadcast', { youtubeVideoId, state: 'scheduled', message: 'Broadcast created; binding stream' })
      await step.do('bind reusable stream', retryable, async () => bindBroadcast(deps.fetcher, await accessToken(), youtubeVideoId, channel.streamId!))
    } else {
      youtubeVideoId = action.youtubeVideoId
    }

    let upcoming = false
    if (desired.scheduledStartTime && !created) {
      upcoming = await step.do('reschedule broadcast', retryable, async () => {
        const token = await accessToken()
        const broadcast = await getBroadcast(deps.fetcher, token, youtubeVideoId)
        if (!broadcast || !reschedulable(broadcast.status.lifeCycleStatus)) return false
        if (broadcast.snippet.scheduledStartTime && Date.parse(broadcast.snippet.scheduledStartTime) === Date.parse(desired.scheduledStartTime!)) return true
        await rescheduleBroadcast(deps.fetcher, token, broadcast, desired.scheduledStartTime!, desired.scheduledEndTime ?? undefined)
        return true
      })
    }

    await step.do('sync title, description and tags', retryable, async () => {
      const token = await accessToken()
      const current = await getVideoSnippet(deps.fetcher, token, youtubeVideoId)
      if (!current) throw new YouTubeError(404, 'videoNotFound', `YouTube video ${youtubeVideoId} was not found on this channel`)
      if (current.title === desired.title && current.description === desired.description && sameTags(current.tags, desired.tags)) return false
      await updateVideoSnippet(deps.fetcher, token, youtubeVideoId, current, { title: desired.title, description: desired.description, tags: desired.tags })
      return true
    })

    return await record('record synced', { youtubeVideoId, syncedHash: hash, state: created || upcoming ? 'scheduled' : 'synced' })
  } catch (error) {
    // Record the failure without the hash, so the next publish tries again.
    const message = error instanceof Error ? error.message : String(error)
    await record('record failure', { state: 'error', message: message.slice(0, 500) })
    if (error instanceof YouTubeError && !error.retryable) return { state: 'error', message }
    throw error
  }
}
