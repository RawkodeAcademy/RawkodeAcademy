import assert from 'node:assert/strict'
import test from 'node:test'
import { isTransientD1Error, retryTransientD1 } from '../src/d1-retry'

test('only explicit D1 network loss is retryable, including nested causes', () => {
  assert.ok(isTransientD1Error(new Error('query', { cause: new Error('D1_ERROR: Network connection lost.') })))
  for (const message of ['Network connection lost.', 'D1_ERROR: UNIQUE constraint failed', 'ValidationError', 'D1_ERROR: not authorized']) {
    assert.equal(isTransientD1Error(new Error(message)), false)
  }
  const cycle = new Error('cycle')
  cycle.cause = cycle
  assert.equal(isTransientD1Error(cycle), false)
})

test('persistent transient failures exhaust three retries; permanent failures never retry', async () => {
  for (const [message, expected] of [['D1_ERROR: Network connection lost.', 4], ['D1_ERROR: UNIQUE constraint failed', 1]] as const) {
    let attempts = 0
    const error = new Error(message)
    await assert.rejects(retryTransientD1(async () => { attempts += 1; throw error }), candidate => candidate === error)
    assert.equal(attempts, expected)
  }
})

test('only a known platform socket close or explicit D1 network loss allows a fresh process', async () => {
  const { isImportConnectionError } = await import('../src/d1-retry')
  const socket = Object.assign(new Error('other side closed'), { name: 'SocketError' })
  assert.ok(isImportConnectionError(new Error('fetch failed', { cause: socket })))
  assert.ok(isImportConnectionError(new Error('D1_ERROR: Network connection lost.')))
  for (const error of [new Error('fetch failed'), new Error('UNIQUE constraint failed'), new Error('not authorized'), new Error('other side closed')]) assert.equal(isImportConnectionError(error), false)
})

test('fresh PR import processes retry only connection exit status and stop after three attempts', async () => {
  const { retryPreviewImport } = await import('../scripts/lib/preview-import-retry')
  let attempts = 0
  await retryPreviewImport(() => { if (++attempts < 3) throw Object.assign(new Error('closed'), { status: 75 }) }, async () => {})
  assert.equal(attempts, 3)
  for (const [status, expected] of [[75, 3], [1, 1], [2, 1], [null, 1]] as const) {
    attempts = 0
    const error = Object.assign(new Error('failed'), { status })
    await assert.rejects(retryPreviewImport(() => { attempts += 1; throw error }, async () => {}), candidate => candidate === error)
    assert.equal(attempts, expected)
  }
})
