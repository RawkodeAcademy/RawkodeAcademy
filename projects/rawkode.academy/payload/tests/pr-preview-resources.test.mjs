import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { isOwnedExistingBucketConflict, pullRequestIdentity } from '../scripts/pr-preview-resources.mjs'

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
