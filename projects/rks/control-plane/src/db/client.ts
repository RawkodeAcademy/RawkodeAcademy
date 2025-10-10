import { drizzle } from 'drizzle-orm/d1'

export interface D1Database {
  prepare(query: string): any
}

export function getDb(env: { DB: D1Database }) {
  return drizzle(env.DB)
}
