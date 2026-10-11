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
