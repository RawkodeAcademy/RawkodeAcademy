// What the CMS says a video should look like on YouTube. Pure, so the hook
// that decides whether to sync and the workflow that syncs agree exactly.
export type ChannelTarget = {
  id: number
  youtubeChannelId: string
  streamId: string | null
  privacy: 'public' | 'unlisted' | 'private'
}

export type VideoSnapshot = {
  id: number
  legacyId: string
  slug: string
  title: string
  description: string
  type: 'live' | 'recorded' | null
  publishedAt: string | null
  duration: number | null
  youtubeId: string | null
  tags: string[]
  chapters: { title: string; startTime: number }[]
}

export type ChannelSyncState = {
  youtubeVideoId?: string
  syncedHash?: string
  state?: 'scheduled' | 'synced' | 'error' | 'unsupported'
  message?: string
  syncedAt?: string
}

export type YouTubeSyncState = Record<string, ChannelSyncState>

export type Desired = { title: string; description: string; tags: string[]; scheduledStartTime: string | null; scheduledEndTime: string | null }

const siteOrigin = 'https://rawkode.academy'
const maxTitle = 100
const maxDescription = 5000
const maxTagCharacters = 500

export function timestamp(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const h = Math.floor(whole / 3600)
  const m = Math.floor((whole % 3600) / 60)
  const s = whole % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1).trimEnd()}…`
}

// YouTube rejects angle brackets in titles and descriptions.
const clean = (value: string) => value.replace(/[<>]/g, '')

export function desiredFor(video: VideoSnapshot): Desired {
  const sections = [clean(video.description.trim())]
  const chapters = [...video.chapters].sort((left, right) => left.startTime - right.startTime)
  if (chapters.length) sections.push(['Chapters', ...chapters.map(chapter => `${timestamp(chapter.startTime)} ${clean(chapter.title)}`)].join('\n'))
  const link = `Watch with notes and resources: ${siteOrigin}/watch/${video.slug}`
  const body = truncate(sections.filter(Boolean).join('\n\n'), maxDescription - link.length - 2)

  const tags: string[] = []
  let used = 0
  for (const tag of video.tags.map(value => clean(value).trim()).filter(Boolean)) {
    if (tags.some(existing => existing.toLowerCase() === tag.toLowerCase())) continue
    // YouTube counts quotes around tags that contain spaces.
    const cost = tag.length + (tag.includes(' ') ? 2 : 0) + (tags.length ? 1 : 0)
    if (used + cost > maxTagCharacters) break
    tags.push(tag)
    used += cost
  }

  const live = video.type === 'live' && video.publishedAt
  const end = live && video.duration ? new Date(Date.parse(video.publishedAt!) + video.duration * 1000).toISOString() : null
  return {
    title: truncate(clean(video.title.trim()), maxTitle),
    description: `${body}\n\n${link}`,
    tags,
    scheduledStartTime: live ? new Date(Date.parse(video.publishedAt!)).toISOString() : null,
    scheduledEndTime: end,
  }
}

export async function desiredHash(desired: Desired, channel: ChannelTarget): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify([desired, channel.youtubeChannelId, channel.privacy]))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

export type Action =
  | { kind: 'create-broadcast' }
  | { kind: 'adopt'; youtubeVideoId: string }
  | { kind: 'update'; youtubeVideoId: string }
  | { kind: 'unsupported'; message: string }

// Back-catalogue videos are never touched unless a channel is selected on
// them; selecting one makes the CMS authoritative for that YouTube video.
export function actionFor(video: VideoSnapshot, state: ChannelSyncState | undefined, now = Date.now()): Action {
  if (state?.youtubeVideoId) return { kind: 'update', youtubeVideoId: state.youtubeVideoId }
  if (video.youtubeId) return { kind: 'adopt', youtubeVideoId: video.youtubeId }
  if (video.type === 'live' && video.publishedAt && Date.parse(video.publishedAt) > now) return { kind: 'create-broadcast' }
  if (video.type === 'live') return { kind: 'unsupported', message: 'Live start time is in the past; set a future time to schedule it on YouTube' }
  return { kind: 'unsupported', message: 'Recorded videos are uploaded on YouTube; set youtubeId and the CMS will keep its metadata in sync' }
}
