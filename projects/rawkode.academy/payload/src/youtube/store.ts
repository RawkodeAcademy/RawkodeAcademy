import type { ChannelSyncState, YouTubeSyncState } from './plan'

// Two plain D1 tables, deliberately not Payload collections: refresh tokens
// must never be reachable through REST or GraphQL, and sync state is written
// by the workflow without going through editorial hooks (which could otherwise
// publish an editor's pending draft). Schema: migration 20261018_youtube_sync.
export class YouTubeStore {
  constructor(private readonly db: D1Database) {}

  async saveCredential(channel: number, youtubeChannelId: string, sealedRefreshToken: string, now = new Date().toISOString()): Promise<void> {
    await this.db.prepare(
      `INSERT INTO youtube_credentials (channel_id, youtube_channel_id, refresh_token, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(channel_id) DO UPDATE SET youtube_channel_id = excluded.youtube_channel_id, refresh_token = excluded.refresh_token, updated_at = excluded.updated_at`,
    ).bind(channel, youtubeChannelId, sealedRefreshToken, now).run()
  }

  async credential(channel: number): Promise<{ youtubeChannelId: string; refreshToken: string } | null> {
    const row = await this.db.prepare('SELECT youtube_channel_id, refresh_token FROM youtube_credentials WHERE channel_id = ?').bind(channel).first<{ youtube_channel_id: string; refresh_token: string }>()
    return row ? { youtubeChannelId: row.youtube_channel_id, refreshToken: row.refresh_token } : null
  }

  async syncState(video: number): Promise<YouTubeSyncState> {
    const { results } = await this.db.prepare('SELECT channel_id, youtube_video_id, synced_hash, state, message, synced_at FROM youtube_sync WHERE video_id = ?').bind(video).all<{ channel_id: number; youtube_video_id: string | null; synced_hash: string | null; state: ChannelSyncState['state']; message: string | null; synced_at: string }>()
    return Object.fromEntries(results.map(row => [String(row.channel_id), {
      ...(row.youtube_video_id ? { youtubeVideoId: row.youtube_video_id } : {}),
      ...(row.synced_hash ? { syncedHash: row.synced_hash } : {}),
      ...(row.state ? { state: row.state } : {}),
      ...(row.message ? { message: row.message } : {}),
      syncedAt: row.synced_at,
    }]))
  }

  // youtube_video_id is never cleared once known: losing it would create a
  // second broadcast on the next sync.
  async record(video: number, channel: number, state: ChannelSyncState, now = new Date().toISOString()): Promise<void> {
    await this.db.prepare(
      `INSERT INTO youtube_sync (video_id, channel_id, youtube_video_id, synced_hash, state, message, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(video_id, channel_id) DO UPDATE SET
         youtube_video_id = COALESCE(youtube_sync.youtube_video_id, excluded.youtube_video_id),
         synced_hash = excluded.synced_hash, state = excluded.state, message = excluded.message, synced_at = excluded.synced_at`,
    ).bind(video, channel, state.youtubeVideoId ?? null, state.syncedHash ?? null, state.state ?? null, state.message ?? null, now).run()
  }
}

export const youtubeTables = [
  `CREATE TABLE IF NOT EXISTS youtube_credentials (
    channel_id INTEGER PRIMARY KEY NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    youtube_channel_id TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS youtube_sync (
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    youtube_video_id TEXT,
    synced_hash TEXT,
    state TEXT CHECK (state IS NULL OR state IN ('scheduled', 'synced', 'error', 'unsupported')),
    message TEXT,
    synced_at TEXT NOT NULL,
    PRIMARY KEY (video_id, channel_id)
  )`,
]
