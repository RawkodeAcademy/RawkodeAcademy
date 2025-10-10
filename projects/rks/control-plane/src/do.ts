// @ts-nocheck
// Durable Object: Shows
// - Maintains ephemeral show state (e.g., raise-hand requests)
// - Persists lifecycle events to D1 where applicable

import { getDb } from './db/client'
import { raiseHands } from './db/schema'
import type { Bindings as Env } from './env'

export class Shows {
  state: DurableObjectState;
  env: Env;
  memory: {
    showId: string | null;
    raiseHands: Array<{ id: string; userId: string; status: 'OPEN' | 'ACCEPTED' | 'REJECTED'; createdAt: string }>;
    updatedAt: string | null;
  };

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.memory = { showId: null, raiseHands: [], updatedAt: null };
  }

  private async load(): Promise<void> {
    const stored = await this.state.storage.get<any>('state');
    if (stored) this.memory = stored;
  }

  private async save(): Promise<void> {
    this.memory.updatedAt = new Date().toISOString();
    await this.state.storage.put('state', this.memory);
  }

  async fetch(request: Request): Promise<Response> {
    await this.load();
    const url = new URL(request.url);
    const pathname = url.pathname;
    try {
      if (pathname.endsWith('/snapshot') && request.method === 'GET') {
        return this.snapshot();
      }

      if (pathname.endsWith('/raise-hand') && request.method === 'POST') {
        const body = await request.json();
        return this.raiseHand(body);
      }

      return new Response('Not Found', { status: 404 });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private async snapshot(): Promise<Response> {
    return new Response(
      JSON.stringify({
        showId: this.memory.showId,
        raiseHands: this.memory.raiseHands,
        updatedAt: this.memory.updatedAt,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  private async raiseHand(payload: { showId: string; userId: string }): Promise<Response> {
    const id = crypto.randomUUID();
    this.memory.showId = payload.showId;
    const record = { id, userId: payload.userId, status: 'OPEN' as const, createdAt: new Date().toISOString() };
    this.memory.raiseHands.push(record);
    await this.save();

    // Persist to D1 (best-effort)
    try {
      const db = getDb(this.env)
      await db.insert(raiseHands).values({
        id,
        showId: payload.showId,
        userId: payload.userId,
        status: 'OPEN',
        createdAt: record.createdAt,
      }).run()
    } catch (_) {
      // ignore write errors in DO bootstrap
    }

    return new Response(JSON.stringify({ request: record }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Minimal Env typing to satisfy TS when not using CF type defs
// types now shared from env.ts
