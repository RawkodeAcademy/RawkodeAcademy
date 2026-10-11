import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { isOwnedExistingBucketConflict, listBuckets, pullRequestIdentity } from '../scripts/pr-preview-resources.mjs'

const fixtureDirectory = mkdtempSync(path.join(tmpdir(), 'pr-preview-identity-'))
const eventPath = path.join(fixtureDirectory, 'event.json')
const headSha = '0123456789abcdef0123456789abcdef01234567'
const mergeSha = 'fedcba9876543210fedcba9876543210fedcba98'

test.after(() => rmSync(fixtureDirectory, { recursive: true, force: true }))

test('PR preview identity uses pull_request.head.sha, not the synthetic GITHUB_SHA', () => {
  writeFileSync(eventPath, JSON.stringify({ pull_request: { number: 1419, head: { sha: headSha } } }))

  assert.deepEqual(pullRequestIdentity({
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_SHA: mergeSha,
  }), { pullRequestNumber: 1419, sha: headSha, sha12: headSha.slice(0, 12) })
})

test('PR preview identity refuses to fall back to GITHUB_SHA when the event head is missing', () => {
  writeFileSync(eventPath, JSON.stringify({ pull_request: { number: 1419, head: {} } }))

  assert.throws(() => pullRequestIdentity({
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_SHA: mergeSha,
  }), /full 40-character head SHA/)
})

test('R2 lookup includes later pages before treating an existing SHA bucket as absent', async () => {
  const target = `rawkode-academy-payload-pr-1419-${headSha.slice(0, 12)}`
  const calls = []
  const buckets = await listBuckets(async (endpoint, init, includePagination) => {
    assert.deepEqual(init, {})
    assert.equal(includePagination, true)
    const query = new URL(endpoint, 'https://api.cloudflare.com').searchParams
    calls.push(query.get('cursor'))
    assert.equal(query.get('per_page'), '100')
    if (!query.has('cursor')) return { result: { buckets: [{ name: 'unrelated' }] }, result_info: { cursor: 'next+/=' } }
    assert.equal(query.get('cursor'), 'next+/=')
    return { result: { buckets: [{ name: target }] }, result_info: {} }
  })
  assert.deepEqual(calls, [null, 'next+/='])
  assert.deepEqual(buckets.map(bucket => bucket.name), ['unrelated', target])
})

test('R2 pagination follows a cursor on an empty page and supports legacy array results', async () => {
  let calls = 0
  assert.deepEqual(await listBuckets(async () => ++calls === 1
    ? { result: { buckets: [] }, result_info: { cursor: 'next' } }
    : { result: [{ name: 'last-page' }], result_info: { cursor: '' } }), [{ name: 'last-page' }])
  assert.equal(calls, 2)
})

test('R2 pagination fails closed on malformed results, repeated cursors, and API errors', async () => {
  await assert.rejects(listBuckets(async () => ({ result: {} })), /invalid R2 bucket list/)
  await assert.rejects(listBuckets(async () => ({ result: { buckets: [] }, result_info: { cursor: 7 } })), /invalid or repeated/)
  let calls = 0
  await assert.rejects(listBuckets(async () => { calls += 1; return { result: { buckets: [] }, result_info: { cursor: 'same' } } }), /invalid or repeated/)
  assert.equal(calls, 2)
  const denied = new Error('Cloudflare API failed (403)')
  await assert.rejects(listBuckets(async () => { throw denied }), error => error === denied)
})

test('reuses only an R2 bucket conflict Cloudflare confirms is already owned', () => {
  const owned = new Error('Cloudflare API POST /accounts/account-id/r2/buckets failed (409): The bucket you tried to create already exists, and you own it.')
  assert.equal(isOwnedExistingBucketConflict(owned), true)
  for (const error of [
    new Error('Cloudflare API POST /accounts/account-id/r2/buckets failed (409): The bucket already exists but is not owned by you.'),
    new Error('Cloudflare API POST /accounts/account-id/r2/buckets failed (403): The bucket you tried to create already exists, and you own it.'),
    new Error('Cloudflare API POST /accounts/account-id/d1/database failed (409): The bucket you tried to create already exists, and you own it.'),
    new Error('Cloudflare API POST /accounts/account-id/r2/buckets failed (409): The bucket you tried to create already exists, and you own it. Extra text'),
    { message: owned.message },
  ]) assert.equal(isOwnedExistingBucketConflict(error), false)
})
