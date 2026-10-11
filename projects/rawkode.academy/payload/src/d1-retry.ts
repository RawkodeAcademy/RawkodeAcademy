import { setTimeout } from 'node:timers/promises'

export const importConnectionExitCode = 75

export function isImportConnectionError(error: unknown): boolean {
  if (isTransientD1Error(error)) return true
  const seen = new Set<unknown>()
  for (let cause = error; cause instanceof Error && !seen.has(cause); cause = cause.cause) {
    seen.add(cause)
    if (cause.name === 'SocketError' && cause.message === 'other side closed') return true
  }
  return false
}

export function isTransientD1Error(error: unknown): boolean {
  const seen = new Set<unknown>()
  for (let cause = error; cause instanceof Error && !seen.has(cause); cause = cause.cause) {
    seen.add(cause)
    // Miniflare returns e.stack in its HTTP 500 body. D1 can include the proxy's
    // fetch frame in error.message when that response is not JSON. Accept only
    // this known frame after the exact network-loss message, not arbitrary text.
    const [message, ...frames] = cause.message.split('\n')
    if (
      /^D1_ERROR: (?:Failed to parse body as JSON, got: Error: )?Network connection lost\.?$/.test(message) &&
      frames.every(frame => /^ {4}at async Object\.fetch \(file:\/\/\/[^\r\n]+\/miniflare\/dist\/src\/workers\/core\/entry\.worker\.js:\d+:\d+\)$/.test(frame))
    ) return true
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
