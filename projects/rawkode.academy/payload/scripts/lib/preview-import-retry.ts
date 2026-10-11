import { setTimeout } from 'node:timers/promises'
import { importConnectionExitCode } from '../../src/d1-retry'

/** Called only after validating the disposable PR/SHA target. A new process
 * obtains a fresh platform proxy and resumes the same source watermark.
 * Validation, conflicts, constraints, signals, and cleanup failures never retry.
 */
export async function retryPreviewImport(run: () => void, pause: (ms: number) => Promise<unknown> = setTimeout): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try { run(); return } catch (error) {
      if (!(error instanceof Error) || !('status' in error) || error.status !== importConnectionExitCode || attempt >= 3) throw error
      console.warn(`PR import connection closed; resuming the same isolated target in a fresh process (${attempt + 1}/3).`)
      await pause(attempt * 1000)
    }
  }
}
