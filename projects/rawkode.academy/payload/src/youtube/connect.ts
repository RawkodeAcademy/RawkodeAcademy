import type { Payload } from 'payload'
import { isStaff } from '../auth/access'
import { authorizeUrl, exchangeCode, type Fetcher, insertReusableStream, myChannel, type OAuthClient } from './api'
import { encryptToken, randomNonce, signState, verifyState } from './secrets'
import { YouTubeStore } from './store'

// Connecting a channel: staff click "Connect YouTube" on a Channel, consent
// once with the Google account that owns it, and the refresh token is sealed
// into D1 where only the sync workflow reads it.
export type ConnectEnv = {
  D1: D1Database
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  YOUTUBE_REDIRECT_URI?: string
  YOUTUBE_TOKEN_KEY?: string
}

export const nonceCookie = 'academy_youtube_connect'
const stateLifetimeMs = 10 * 60 * 1000
const noStore = { 'cache-control': 'no-store' }

export function oauthClient(env: ConnectEnv): (OAuthClient & { tokenKey: string }) | null {
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, YOUTUBE_REDIRECT_URI: redirectUri, YOUTUBE_TOKEN_KEY: tokenKey } = env
  return clientId && clientSecret && redirectUri && tokenKey ? { clientId, clientSecret, redirectUri, tokenKey } : null
}

const readCookie = (headers: Headers, name: string) =>
  headers.get('cookie')?.split(';').map(part => part.trim().split('=')).find(([key]) => key === name)?.[1] ?? null

const cookie = (value: string, maxAge: number) => `${nonceCookie}=${value}; Path=/api/youtube; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`

const page = (status: number, message: string) =>
  new Response(`<!doctype html><meta charset="utf-8"><title>YouTube connection</title><p>${message.replace(/[<>&]/g, '')}</p><p><a href="/admin/collections/channels">Back to channels</a></p>`, { status, headers: { ...noStore, 'content-type': 'text/html; charset=utf-8', 'set-cookie': cookie('', 0) } })

export async function beginConnect(request: Request, payload: Payload, env: ConnectEnv, now = Date.now()): Promise<Response> {
  const { user } = await payload.auth({ headers: request.headers })
  if (!isStaff(user)) return page(401, 'Sign in as staff to connect a channel.')
  const client = oauthClient(env)
  if (!client) return page(503, 'YouTube is not configured: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI and YOUTUBE_TOKEN_KEY.')
  const channel = Number(new URL(request.url).searchParams.get('channel'))
  if (!Number.isSafeInteger(channel) || channel < 1) return page(400, 'Choose a channel to connect.')
  await payload.findByID({ collection: 'channels' as never, id: channel, depth: 0, overrideAccess: false, user })
  const nonce = randomNonce()
  const state = await signState(client.tokenKey, { channel, nonce, expiresAt: now + stateLifetimeMs })
  return new Response(null, { status: 302, headers: { ...noStore, location: authorizeUrl(client, state), 'set-cookie': cookie(nonce, stateLifetimeMs / 1000) } })
}

export async function finishConnect(request: Request, payload: Payload, env: ConnectEnv, fetcher: Fetcher = fetch, now = Date.now()): Promise<Response> {
  const { user } = await payload.auth({ headers: request.headers })
  if (!isStaff(user)) return page(401, 'Sign in as staff to connect a channel.')
  const client = oauthClient(env)
  if (!client) return page(503, 'YouTube is not configured.')
  const url = new URL(request.url)
  if (url.searchParams.get('error')) return page(400, `Google did not grant access: ${url.searchParams.get('error')}`)
  let channelId: number
  try {
    channelId = (await verifyState(client.tokenKey, url.searchParams.get('state') ?? '', readCookie(request.headers, nonceCookie), now)).channel
  } catch (error) {
    return page(400, error instanceof Error ? error.message : 'Invalid connection request')
  }
  const code = url.searchParams.get('code')
  if (!code) return page(400, 'Google returned no authorization code.')
  try {
    const channel = await payload.findByID({ collection: 'channels' as never, id: channelId, depth: 0, overrideAccess: false, user }) as unknown as Record<string, any>
    const token = await exchangeCode(fetcher, client, code)
    if (!token.refresh_token) return page(400, 'Google returned no refresh token. Remove the app from the Google account and connect again.')
    const owned = await myChannel(fetcher, token.access_token)
    if (channel.youtubeChannelId && channel.youtubeChannelId !== owned.id) {
      return page(409, `That Google account manages "${owned.title}" (${owned.id}), not this channel (${channel.youtubeChannelId}). Sign in with the owning account.`)
    }
    const streamId = channel.streamId || await insertReusableStream(fetcher, token.access_token, `${owned.title} (Rawkode Academy CMS)`)
    await new YouTubeStore(env.D1).saveCredential(channelId, owned.id, await encryptToken(client.tokenKey, token.refresh_token, String(channelId)))
    await payload.update({
      collection: 'channels' as never, id: channelId, depth: 0, overrideAccess: false, user,
      context: { youtubeConnect: true },
      data: { youtubeChannelId: owned.id, youtubeTitle: owned.title, streamId, connection: 'connected', connectedAt: new Date(now).toISOString() } as never,
    })
    return new Response(null, { status: 302, headers: { ...noStore, location: `/admin/collections/channels/${channelId}`, 'set-cookie': cookie('', 0) } })
  } catch (error) {
    payload.logger.error({ msg: 'YouTube connection failed', channel: channelId, error: String(error) })
    return page(502, `Connecting the channel failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}
