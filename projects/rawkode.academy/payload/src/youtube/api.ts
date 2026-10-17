// Minimal Google OAuth + YouTube Data API v3 client. Every call takes the
// fetcher so tests run without the network. Calls draw on the project's daily
// quota (10,000 units by default; costs per method are in Google's quota
// calculator). The sync skips unchanged content so steady state costs nothing.
export type Fetcher = typeof fetch

export const youtubeScope = 'https://www.googleapis.com/auth/youtube.force-ssl'
const tokenEndpoint = 'https://oauth2.googleapis.com/token'
const authorizeEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth'
const api = 'https://www.googleapis.com/youtube/v3'

export class YouTubeError extends Error {
  constructor(public status: number, public reason: string, message: string) { super(message) }
  // Quota, auth and validation failures will not fix themselves on retry.
  get retryable(): boolean {
    return this.status >= 500 || this.status === 429 || this.reason === 'rateLimitExceeded' || this.reason === 'backendError'
  }
}

async function call<T>(fetcher: Fetcher, url: string, init: RequestInit): Promise<T> {
  const response = await fetcher(url, init)
  const text = await response.text()
  const body = text ? JSON.parse(text) : {}
  if (!response.ok) {
    const error = body?.error
    const reason = error?.errors?.[0]?.reason ?? (typeof error === 'string' ? error : 'unknown')
    const message = error?.message ?? body?.error_description ?? text
    throw new YouTubeError(response.status, String(reason), `${init.method ?? 'GET'} ${url.split('?')[0]}: ${response.status} ${reason}: ${message}`)
  }
  return body as T
}

export type OAuthClient = { clientId: string; clientSecret: string; redirectUri: string }

export function authorizeUrl(client: OAuthClient, state: string): string {
  const url = new URL(authorizeEndpoint)
  url.searchParams.set('client_id', client.clientId)
  url.searchParams.set('redirect_uri', client.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', youtubeScope)
  // offline + consent guarantees a refresh token even on re-connect.
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('state', state)
  return url.toString()
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; scope: string }

export async function exchangeCode(fetcher: Fetcher, client: OAuthClient, code: string): Promise<TokenResponse> {
  return call<TokenResponse>(fetcher, tokenEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: client.clientId, client_secret: client.clientSecret, redirect_uri: client.redirectUri, grant_type: 'authorization_code' }),
  })
}

export async function refreshAccessToken(fetcher: Fetcher, client: Pick<OAuthClient, 'clientId' | 'clientSecret'>, refreshToken: string): Promise<string> {
  const token = await call<TokenResponse>(fetcher, tokenEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: client.clientId, client_secret: client.clientSecret, grant_type: 'refresh_token' }),
  })
  return token.access_token
}

const auth = (accessToken: string, json = false): HeadersInit => ({
  authorization: `Bearer ${accessToken}`,
  accept: 'application/json',
  ...(json ? { 'content-type': 'application/json' } : {}),
})

export async function myChannel(fetcher: Fetcher, accessToken: string): Promise<{ id: string; title: string }> {
  const body = await call<{ items?: { id: string; snippet: { title: string } }[] }>(fetcher, `${api}/channels?part=snippet&mine=true`, { headers: auth(accessToken) })
  const channel = body.items?.[0]
  if (!channel) throw new YouTubeError(404, 'noChannel', 'The Google account has no YouTube channel')
  return { id: channel.id, title: channel.snippet.title }
}

// One reusable RTMP stream per channel; every broadcast binds to it, so the
// studio keeps a single stream key.
export async function insertReusableStream(fetcher: Fetcher, accessToken: string, title: string): Promise<string> {
  const body = await call<{ id: string }>(fetcher, `${api}/liveStreams?part=snippet,cdn,contentDetails,status`, {
    method: 'POST',
    headers: auth(accessToken, true),
    body: JSON.stringify({ snippet: { title }, cdn: { ingestionType: 'rtmp', resolution: 'variable', frameRate: 'variable' }, contentDetails: { isReusable: true } }),
  })
  return body.id
}

export type BroadcastInput = { title: string; description: string; scheduledStartTime: string; scheduledEndTime?: string; privacyStatus: 'public' | 'unlisted' | 'private' }

export async function insertBroadcast(fetcher: Fetcher, accessToken: string, input: BroadcastInput): Promise<string> {
  const body = await call<{ id: string }>(fetcher, `${api}/liveBroadcasts?part=snippet,status,contentDetails`, {
    method: 'POST',
    headers: auth(accessToken, true),
    body: JSON.stringify({
      snippet: { title: input.title, description: input.description, scheduledStartTime: input.scheduledStartTime, ...(input.scheduledEndTime ? { scheduledEndTime: input.scheduledEndTime } : {}) },
      status: { privacyStatus: input.privacyStatus, selfDeclaredMadeForKids: false },
      contentDetails: { enableAutoStart: false, enableAutoStop: true },
    }),
  })
  return body.id
}

export async function bindBroadcast(fetcher: Fetcher, accessToken: string, broadcastId: string, streamId: string): Promise<void> {
  const url = new URL(`${api}/liveBroadcasts/bind`)
  url.searchParams.set('id', broadcastId)
  url.searchParams.set('streamId', streamId)
  url.searchParams.set('part', 'id,contentDetails')
  await call(fetcher, url.toString(), { method: 'POST', headers: auth(accessToken) })
}

type BroadcastResource = { id: string; snippet: Record<string, unknown> & { title: string; scheduledStartTime?: string }; status: { lifeCycleStatus: string } }

export async function getBroadcast(fetcher: Fetcher, accessToken: string, id: string): Promise<BroadcastResource | null> {
  const body = await call<{ items?: BroadcastResource[] }>(fetcher, `${api}/liveBroadcasts?part=snippet,status&id=${encodeURIComponent(id)}`, { headers: auth(accessToken) })
  return body.items?.[0] ?? null
}

// Schedule can only move before the broadcast goes live.
export const reschedulable = (lifeCycleStatus: string) => ['created', 'ready', 'testStarting', 'testing'].includes(lifeCycleStatus)

export async function rescheduleBroadcast(fetcher: Fetcher, accessToken: string, current: BroadcastResource, scheduledStartTime: string, scheduledEndTime?: string): Promise<void> {
  // liveBroadcasts.update replaces every mutable snippet property it is sent.
  const snippet = { ...current.snippet, scheduledStartTime, ...(scheduledEndTime ? { scheduledEndTime } : {}) }
  await call(fetcher, `${api}/liveBroadcasts?part=snippet`, { method: 'PUT', headers: auth(accessToken, true), body: JSON.stringify({ id: current.id, snippet }) })
}

type VideoSnippet = Record<string, unknown> & { title: string; description?: string; tags?: string[]; categoryId: string }

export async function getVideoSnippet(fetcher: Fetcher, accessToken: string, id: string): Promise<VideoSnippet | null> {
  const body = await call<{ items?: { snippet: VideoSnippet }[] }>(fetcher, `${api}/videos?part=snippet&id=${encodeURIComponent(id)}`, { headers: auth(accessToken) })
  return body.items?.[0]?.snippet ?? null
}

export type SnippetChanges = { title: string; description: string; tags: string[] }

// videos.update deletes any snippet property it is not sent, so merge the CMS
// fields into the current snippet (keeping categoryId, language, etc.).
export async function updateVideoSnippet(fetcher: Fetcher, accessToken: string, id: string, current: VideoSnippet, changes: SnippetChanges): Promise<void> {
  const { thumbnails: _thumbnails, localized: _localized, channelId: _channelId, channelTitle: _channelTitle, publishedAt: _publishedAt, liveBroadcastContent: _live, ...writable } = current
  const snippet = { ...writable, title: changes.title, description: changes.description, tags: changes.tags }
  await call(fetcher, `${api}/videos?part=snippet`, { method: 'PUT', headers: auth(accessToken, true), body: JSON.stringify({ id, snippet }) })
}
