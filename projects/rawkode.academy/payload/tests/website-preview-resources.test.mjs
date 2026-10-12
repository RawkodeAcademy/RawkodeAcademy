import assert from 'node:assert/strict'
import test from 'node:test'
import { cleanup, ensureWebsitePreviewResources, namesForPullRequest } from '../scripts/pr-preview-resources.mjs'
import { WEBSITE_PREVIEW_CONTENT_SOURCE as source } from '../scripts/website-preview-source.mjs'

const identity = { pullRequestNumber: 1419, sha: 'b'.repeat(40), sha12: 'b'.repeat(12) }
const names = namesForPullRequest(identity.pullRequestNumber, identity.sha)
const sessionId = '1'.repeat(32)

function route(endpoint) {
  return new URL(endpoint, 'https://api.cloudflare.com').pathname.replace(/^\/accounts\/[^/]+/, '')
}

test('website preview provisioning creates only a session namespace and retains website head identity', async () => {
  const calls = []
  const resources = await ensureWebsitePreviewResources(identity, async (endpoint, init = {}) => {
    calls.push({ endpoint, init })
    assert.equal(route(endpoint), '/storage/kv/namespaces', 'Website provisioning attempted to access a non-session resource.')
    if (!init.method || init.method === 'GET') return []
    assert.equal(init.method, 'POST')
    assert.deepEqual(JSON.parse(init.body), { title: names.sessionTitle })
    return { id: sessionId, title: names.sessionTitle }
  })
  assert.equal(resources.pullRequestNumber, identity.pullRequestNumber)
  assert.equal(resources.sha, identity.sha)
  assert.equal(resources.websiteWorkerName, names.websiteWorkerName)
  assert.equal(resources.websiteIsolationWorkerName, names.websiteIsolationWorkerName)
  assert.equal(resources.sessionNamespaceId, sessionId)
  assert.notEqual(resources.sha, source.sha)
  assert.equal(calls.filter(call => call.init.method === 'POST').length, 1)
  for (const key of ['databaseId', 'databaseName', 'bucketName']) assert.equal(Object.hasOwn(resources, key), false)
})

test('website preview retries reuse the exact session namespace without creating resources', async () => {
  const resources = await ensureWebsitePreviewResources(identity, async (endpoint, init = {}) => {
    assert.equal(route(endpoint), '/storage/kv/namespaces')
    assert.equal(init.method ?? 'GET', 'GET')
    return [
      { id: '2'.repeat(32), title: 'rawkode-academy-website-pr-1420-bbbbbbbbbbbb-session' },
      { id: sessionId, title: names.sessionTitle },
    ]
  })
  assert.equal(resources.sessionNamespaceId, sessionId)
})

test('cleanup preserves the populated source by Worker, bucket, D1 name and D1 UUID while removing disposable previews', async () => {
  const disposableDatabaseId = '00000000-0000-4000-8000-000000000001'
  const databases = [
    { uuid: source.databaseId, name: source.databaseName },
    // Either stable identity protects the source even after a name change or a stale listing.
    { uuid: source.databaseId, name: 'rawkode-academy-payload-pr-1419-cccccccccccc' },
    { uuid: '00000000-0000-4000-8000-000000000002', name: source.databaseName },
    { uuid: disposableDatabaseId, name: names.databaseName },
    { uuid: 'production-id', name: 'rawkode-academy-payload' },
    { uuid: 'other-pr-id', name: 'rawkode-academy-payload-pr-1420-bbbbbbbbbbbb' },
    { uuid: 'malformed-id', name: names.databaseName + '-unexpected' },
  ]
  const buckets = [source.bucketName, names.bucketName, 'rawkode-academy-payload', 'rawkode-academy-payload-pr-1420-bbbbbbbbbbbb', names.bucketName + '-unexpected'].map(name => ({ name }))
  const workers = [
    source.workerName, names.workerName, names.websiteWorkerName, names.websiteIsolationWorkerName,
    'rawkode-academy-payload', 'rawkode-academy-website',
    'rawkode-academy-website-pr-1420-bbbbbbbbbbbb', names.websiteWorkerName + '-unexpected',
  ].map(id => ({ id }))
  const namespaces = [
    { id: sessionId, title: names.sessionTitle },
    { id: 'production-session', title: 'rawkode-academy-website-session' },
    { id: 'other-pr-session', title: 'rawkode-academy-website-pr-1420-bbbbbbbbbbbb-session' },
    { id: 'malformed-session', title: names.sessionTitle + '-unexpected' },
  ]
  const deleted = []
  const objectKey = 'derived-diagrams/preview fixture.svg'
  await cleanup(identity.pullRequestNumber, async (endpoint, init = {}, includePagination) => {
    const pathname = route(endpoint)
    if (init.method === 'DELETE') {
      deleted.push(pathname)
      return {}
    }
    assert.equal(init.method ?? 'GET', 'GET', 'Cleanup attempted an unexpected mutation.')
    if (pathname === '/d1/database') return databases
    if (pathname === '/r2/buckets') {
      assert.equal(includePagination, true)
      return { result: { buckets }, result_info: {} }
    }
    if (pathname === '/storage/kv/namespaces') return namespaces
    if (pathname === '/workers/scripts') return workers
    assert.equal(pathname, `/r2/buckets/${names.bucketName}/objects`, 'Cleanup read objects from a protected or unrelated bucket.')
    assert.equal(includePagination, true)
    return { result: [{ key: objectKey }], result_info: {} }
  })
  assert.deepEqual(new Set(deleted), new Set([
    `/workers/scripts/${names.workerName}`,
    `/workers/scripts/${names.websiteWorkerName}`,
    `/workers/scripts/${names.websiteIsolationWorkerName}`,
    `/d1/database/${disposableDatabaseId}`,
    `/r2/buckets/${names.bucketName}/objects/${encodeURIComponent(objectKey)}`,
    `/r2/buckets/${names.bucketName}`,
    `/storage/kv/namespaces/${sessionId}`,
  ]))
  assert.equal(deleted.length, 7)
})
