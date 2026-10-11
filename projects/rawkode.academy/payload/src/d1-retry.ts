import { setTimeout } from 'node:timers/promises'

export function isTransientD1Error(error: unknown): boolean {
  const seen = new Set<unknown>()
  for (let cause = error; cause instanceof Error && !seen.has(cause); cause = cause.cause) {
    seen.add(cause)
    if (/^D1_ERROR: Network connection lost\.?$/.test(cause.message)) return true
  }
  return false
}

/** Retry a complete source-identity operation, never a blind INSERT or batch.
 * A lost response does not tell us whether the preceding write committed.
 * Callers must re-read the durable document before deciding to create/update.
 */
export async function retryTransientD1<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try { return await operation() } catch (error) {
      if (!isTransientD1Error(error) || attempt >= 3) throw error
      console.warn(`Transient D1 connection failure; re-reading source identity before retry ${attempt + 1}/3.`)
      await setTimeout(250 * (attempt + 1) ** 2)
    }
  }
}
