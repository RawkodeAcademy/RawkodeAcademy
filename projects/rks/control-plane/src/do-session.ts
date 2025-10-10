// @ts-nocheck
// Durable Object: Sessions — per-session control-state holder
import type { Bindings as Env } from './env'

export class Sessions {
  state: DurableObjectState
  env: Env
  memory: {
    sessionId: string | null
    raiseHands: Array<{ id: string; userId: string; status: 'OPEN' | 'ACCEPTED' | 'REJECTED'; createdAt: string }>
    updatedAt: string | null
  }

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    this.memory = { sessionId: null, raiseHands: [], updatedAt: null }
  }

  private async load() {
    const stored = await this.state.storage.get<any>('state')
    if (stored) this.memory = stored
  }
  private async save() {
    this.memory.updatedAt = new Date().toISOString()
    await this.state.storage.put('state', this.memory)
  }

  async fetch(request: Request): Promise<Response> {
    await this.load()
    const url = new URL(request.url)
    const pathname = url.pathname
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeadersFrom(request) })
      }
      if (pathname.endsWith('/snapshot') && request.method === 'GET') {
        return new Response(JSON.stringify(this.memory), { status: 200, headers: corsHeadersFrom(request) })
      }
      if (pathname.endsWith('/raise-hand') && request.method === 'POST') {
        const body = await request.json()
        const id = crypto.randomUUID()
        this.memory.sessionId = body.sessionId
        const rec = { id, userId: body.userId, status: 'OPEN' as const, createdAt: new Date().toISOString() }
        this.memory.raiseHands.push(rec)
        await this.save()
        return new Response(JSON.stringify({ request: rec }), { status: 201, headers: corsHeadersFrom(request) })
      }
      return new Response('Not Found', { status: 404, headers: corsHeadersFrom(request) })
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500, headers: corsHeadersFrom(request) })
    }
  }
}

// types now shared from env.ts

function corsHeadersFrom(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '*'
  const reqHeaders = req.headers.get('access-control-request-headers') || 'content-type, x-part-no, x-content-sha256'
  const reqMethod = req.headers.get('access-control-request-method') || 'GET,POST,PUT,OPTIONS'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': reqMethod,
    'Access-Control-Allow-Headers': reqHeaders,
    'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
    'Content-Type': 'application/json',
  }
}
