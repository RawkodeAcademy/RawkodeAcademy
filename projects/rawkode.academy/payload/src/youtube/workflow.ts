import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers'
import { YouTubeStore } from './store'
import { runSync, type SyncParams } from './sync'

type Env = { D1: D1Database; YOUTUBE_TOKEN_KEY: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string }

// Instance ids are `yt-<video>-<channel>-<hash>`, so a repeated publish of the
// same content is a no-op at creation time.
export class YouTubeSyncWorkflow extends WorkflowEntrypoint<Env, SyncParams> {
  async run(event: WorkflowEvent<SyncParams>, step: WorkflowStep) {
    return runSync({
      store: new YouTubeStore(this.env.D1),
      fetcher: fetch,
      tokenKey: this.env.YOUTUBE_TOKEN_KEY,
      client: { clientId: this.env.GOOGLE_CLIENT_ID, clientSecret: this.env.GOOGLE_CLIENT_SECRET },
    }, event.payload, {
      // Step results here are plain JSON (ids, booleans, sync state).
      do: (name, config, run) => step.do(name, { retries: { limit: config.retries.limit, delay: '10 seconds', backoff: 'exponential' } }, run as never) as never,
    })
  }
}
