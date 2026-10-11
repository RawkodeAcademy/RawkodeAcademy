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


test('recognizes only the exact D1 JSON transport wrapper, including nested query errors', async () => {
  const { isImportConnectionError } = await import('../src/d1-retry')
  const message = 'D1_ERROR: Failed to parse body as JSON, got: Error: Network connection lost.'
  const wrapped = new Error('Failed query: select chapters', { cause: new Error(message, {
    cause: new Error('Failed to parse body as JSON, got: Error: Network connection lost.'),
  }) })
  assert.ok(isTransientD1Error(wrapped))
  assert.ok(isImportConnectionError(wrapped))
  assert.ok(isTransientD1Error(new Error(message.slice(0, -1))))
  let attempts = 0
  assert.equal(await retryTransientD1(async () => {
    if (++attempts === 1) throw wrapped
    return 'source identity re-read'
  }), 'source identity re-read')
  assert.equal(attempts, 2)
  for (const invalid of [
    'Failed to parse body as JSON, got: Error: Network connection lost.',
    'D1_ERROR: Failed to parse body as JSON, got: <html>Bad Gateway</html>',
    'D1_ERROR: Failed to parse body as JSON, got: Error: not authorized',
    'D1_ERROR: Failed to parse body as JSON, got: Error: UNIQUE constraint failed',
    `${message} UNIQUE constraint failed`,
  ]) {
    const error = new Error('Failed query', { cause: new Error(invalid) })
    assert.equal(isTransientD1Error(error), false, invalid)
    assert.equal(isImportConnectionError(error), false, invalid)
  }
})
