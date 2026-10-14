import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { handlePreviewContent } from '../../scripts/preview-content-proxy.mjs'
import { assertPreviewVerification } from '../../review/deploy/check-preview-verification.mjs'
import { namesForPullRequest } from '../../../payload/scripts/pr-preview-resources.mjs'
import { WEBSITE_PREVIEW_CONTENT_SOURCE } from '../../../payload/scripts/website-preview-source.mjs'

const origin = 'https://payload-content.internal'
const checksum = 'a'.repeat(64)

for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
  test(`preview content rejects ${method} without invoking the populated source`, async () => {
    const source = { fetch: async () => assert.fail('A rejected method reached the source Worker.') }
    for (const pathname of ['/v1/collections/videos', '/v1/preview/readiness']) {
      const response = await handlePreviewContent(new Request(origin + pathname, { method }), source)
      assert.equal(response.status, 405)
      assert.equal(response.headers.get('allow'), 'GET')
    }
  })
}

for (const pathname of [
  '/v1/preview/readiness', '/v1/preview/readiness/', '/api/videos', '/admin',
  '/v1/collections', '/v1/collections/', '/v1/collections/videos/nested',
  '/v1/assets', '/v1/assets/', '/v1/assets/id/nested',
  '/v1/diagrams/', `/v1/diagrams/${'a'.repeat(63)}.svg`,
  `/v1/diagrams/${checksum}.png`, `/v1/diagrams/${checksum.toUpperCase()}.svg`,
  '/v1/demos/extra', '/v1/demos/',
]) {
  test(`preview content denies unrecognized path ${pathname} before source invocation`, async () => {
    const response = await handlePreviewContent(new Request(origin + pathname), {
      fetch: async () => assert.fail('A denied path reached the source Worker.'),
    })
    assert.equal(response.status, 404)
  })
}

for (const pathname of [
  '/v1/collections/videos?limit=1&view=full',
  '/v1/collections/course-modules?slug=complete-guide-zitadel%2F01-introduction&view=summary',
  '/v1/assets/abcdefghijklmnopqrstuvwx',
  `/v1/diagrams/${checksum}.svg`,
  '/v1/demos?course=complete-guide-zitadel&module=complete-guide-zitadel%2F01-introduction&resource=oauth-pkce-app',
]) {
  test(`preview content forwards public GET ${pathname} without changing its request`, async () => {
    const request = new Request(origin + pathname, { headers: { accept: 'application/json', 'if-none-match': '"fixture"' } })
    let calls = 0
    const response = await handlePreviewContent(request, {
      fetch: async forwarded => {
        calls += 1
        assert.equal(forwarded.method, 'GET')
        assert.equal(forwarded.url, request.url)
        assert.equal(forwarded.headers.get('accept'), 'application/json')
        assert.equal(forwarded.headers.get('if-none-match'), '"fixture"')
        return new Response('public fixture', { status: 206, headers: { 'cache-control': 'public, max-age=30', etag: '"fixture"' } })
      },
    })
    assert.equal(calls, 1)
    assert.equal(response.status, 206)
    assert.equal(response.headers.get('cache-control'), 'public, max-age=30')
    assert.equal(response.headers.get('etag'), '"fixture"')
    assert.equal(await response.text(), 'public fixture')
  })
}

test('preview content preserves source errors instead of returning successful empty content', async () => {
  const response = await handlePreviewContent(new Request(origin + '/v1/collections/videos'), {
    fetch: async () => Response.json({ error: 'source unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } }),
  })
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { error: 'source unavailable' })
})

class WorkerEntrypoint {
  constructor(ctx, env) {
    this.ctx = ctx
    this.env = env
  }
}

async function websiteWorker({ cacheEligible = false } = {}) {
  const calls = { astro: [], cached: [], cacheEligibility: [] }
  const context = vm.createContext({ Request, Response, Headers, URL, console })
  const source = ts.transpileModule(readFileSync(new URL('../worker.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = new vm.SourceTextModule(source, { context })
  await module.link(specifier => {
    if (specifier === '@astrojs/cloudflare/handler') return new vm.SyntheticModule(['handle'], function () {
      this.setExport('handle', async request => {
        calls.astro.push(request)
        return new Response('Astro response')
      })
    }, { context })
    if (specifier === 'cloudflare:workers') return new vm.SyntheticModule(['WorkerEntrypoint'], function () {
      this.setExport('WorkerEntrypoint', WorkerEntrypoint)
    }, { context })
    assert.equal(specifier, './lib/public-cache-gateway')
    return new vm.SyntheticModule(['canUseCachedAstro', 'cachedAstroProps'], function () {
      this.setExport('canUseCachedAstro', (request, enabled) => {
        calls.cacheEligibility.push({ request, enabled })
        return cacheEligible
      })
      this.setExport('cachedAstroProps', request => ({ host: new URL(request.url).host }))
    }, { context })
  })
  await module.evaluate()
  const ctx = { exports: { CachedAstro: ({ props }) => ({ fetch: async request => {
    calls.cached.push({ request, props })
    return new Response('Cached Astro response')
  } }) } }
  return { worker: module.namespace.default, calls, ctx }
}

test('actual website gateway rejects preview mutations before checking cache or dispatching Astro', async () => {
  // Deliberately make every method cache-eligible to falsify an incorrectly ordered guard.
  const { worker, calls, ctx } = await websiteWorker({ cacheEligible: true })
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
    const response = await worker.fetch(new Request('https://preview.example/api/cms-preview-check', { method }), {
      PAYLOAD_PREVIEW_PR: '1419', PUBLIC_SSR_CACHE_ENABLED: 'true',
    }, ctx)
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('allow'), 'GET')
    assert.equal(response.headers.get('cache-control'), 'no-store')
  }
  assert.equal(calls.astro.length, 0)
  assert.equal(calls.cached.length, 0)
  assert.equal(calls.cacheEligibility.length, 0)
})

test('actual website gateway preserves production POST dispatch', async () => {
  const { worker, calls, ctx } = await websiteWorker()
  const request = new Request('https://rawkode.academy/api/applications', { method: 'POST' })
  const response = await worker.fetch(request, {}, ctx)
  assert.equal(response.status, 200)
  assert.equal(await response.text(), 'Astro response')
  assert.equal(response.headers.get('x-website-cache-route'), 'bypass')
  assert.deepEqual(calls.astro, [request])
  assert.equal(calls.cached.length, 0)
})

test('actual website gateway retains host-isolated cached GET dispatch in previews', async () => {
  const { worker, calls, ctx } = await websiteWorker({ cacheEligible: true })
  const request = new Request('https://isolated-preview.example/watch')
  const response = await worker.fetch(request, { PAYLOAD_PREVIEW_PR: '1419', PUBLIC_SSR_CACHE_ENABLED: 'true' }, ctx)
  assert.equal(await response.text(), 'Cached Astro response')
  assert.equal(response.headers.get('x-website-cache-route'), 'public-cache')
  assert.equal(calls.astro.length, 0)
  assert.equal(calls.cached.length, 1)
  assert.equal(calls.cached[0].request, request)
  assert.equal(calls.cached[0].props.host, 'isolated-preview.example')
})

test('actual isolation Worker exposes public content only through its named GET-only entrypoint', async () => {
  const context = vm.createContext({ Request, Response, Headers, URL, console })
  const module = new vm.SourceTextModule(readFileSync(new URL('../../scripts/preview-isolation-worker.mjs', import.meta.url), 'utf8'), { context })
  const proxyCalls = []
  await module.link(specifier => {
    if (specifier === 'cloudflare:workers') return new vm.SyntheticModule(['WorkerEntrypoint'], function () {
      this.setExport('WorkerEntrypoint', WorkerEntrypoint)
    }, { context })
    assert.equal(specifier, './preview-content-proxy.mjs')
    return new vm.SyntheticModule(['handlePreviewContent'], function () {
      this.setExport('handlePreviewContent', async (request, binding) => {
        proxyCalls.push({ request, binding })
        return handlePreviewContent(request, binding)
      })
    }, { context })
  })
  await module.evaluate()
  let sourceCalls = 0
  const source = { fetch: async () => {
    sourceCalls += 1
    return Response.json({ docs: [{ slug: 'public-video' }] })
  } }
  const request = new Request(origin + '/v1/collections/videos')
  const defaultResponse = await module.namespace.default.fetch(request, { PUBLIC_CONTENT_SOURCE: source })
  assert.equal(defaultResponse.status, 503)
  assert.equal(defaultResponse.headers.get('cache-control'), 'no-store')
  assert.equal(proxyCalls.length, 0)
  assert.equal(sourceCalls, 0)
  const entrypoint = new module.namespace.PublicContentReadOnly({}, { PUBLIC_CONTENT_SOURCE: source })
  const response = await entrypoint.fetch(request)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { docs: [{ slug: 'public-video' }] })
  assert.equal(proxyCalls[0].request, request)
  assert.equal(proxyCalls[0].binding, source)
  assert.equal(sourceCalls, 1)
  assert.equal((await entrypoint.fetch(new Request(origin + '/v1/preview/readiness', { method: 'POST' }))).status, 405)
  assert.equal((await entrypoint.fetch(new Request(origin + '/v1/preview/readiness'))).status, 404)
  assert.equal(sourceCalls, 1)
})

const verificationIdentity = { pullRequestNumber: 1419, sha: 'b'.repeat(40) }
const verifiedPreviewUrl = `https://0123abcd-rawkode-academy-website-pr-1419-${'b'.repeat(12)}.rawkodeacademy.workers.dev/`
const currentVerification = () => ({
  pullRequestNumber: verificationIdentity.pullRequestNumber,
  websiteSha: verificationIdentity.sha,
  previewUrl: verifiedPreviewUrl,
  contentSource: {
    ...WEBSITE_PREVIEW_CONTENT_SOURCE,
    pullRequestNumber: verificationIdentity.pullRequestNumber,
    workerName: `${namesForPullRequest(verificationIdentity.pullRequestNumber, verificationIdentity.sha).workerName}-content`,
    sha: verificationIdentity.sha,
    dataSha: WEBSITE_PREVIEW_CONTENT_SOURCE.sha,
  },
  readOnly: true,
})

test('preview delivery verifier accepts only the current isolated version preview and pinned source', () => {
  assert.equal(assertPreviewVerification(currentVerification(), verificationIdentity), verifiedPreviewUrl)
})

for (const value of [undefined, null, {}, { readOnly: true }]) {
  test(`preview delivery verifier fails closed on missing verification: ${JSON.stringify(value)}`, () => {
    assert.throws(() => assertPreviewVerification(value, verificationIdentity), /No verified read-only website preview/)
  })
}

for (const [name, changes] of [
  ['stale website head', { websiteSha: 'c'.repeat(40) }],
  ['different PR', { pullRequestNumber: 1420 }],
  ['string PR identity', { pullRequestNumber: '1419' }],
  ['missing read-only evidence', { readOnly: undefined }],
  ['false read-only evidence', { readOnly: false }],
]) {
  test(`preview delivery verifier rejects ${name}`, () => {
    assert.throws(() => assertPreviewVerification({ ...currentVerification(), ...changes }, verificationIdentity), /No verified read-only website preview/)
  })
}

for (const [name, changes] of [
  ['a production Worker', { workerName: 'rawkode-academy-payload' }],
  ['the historical baseline Worker', { workerName: WEBSITE_PREVIEW_CONTENT_SOURCE.workerName, sha: WEBSITE_PREVIEW_CONTENT_SOURCE.sha }],
  ['another backend version', { sha: 'd'.repeat(40) }],
  ['a replaced data baseline', { dataSha: 'd'.repeat(40) }],
  ['another database', { databaseId: '0'.repeat(32) }],
  ['the editorial entrypoint', { entrypoint: 'ReviewBridge' }],
  ['the default backend entrypoint', { entrypoint: undefined }],
]) {
  test(`preview delivery verifier rejects source evidence for ${name}`, () => {
    const value = currentVerification()
    value.contentSource = { ...value.contentSource, ...changes }
    assert.throws(() => assertPreviewVerification(value, verificationIdentity), /unexpected public content source/)
  })
}

test('preview delivery verifier rejects absent source evidence', () => {
  const value = currentVerification()
  delete value.contentSource
  assert.throws(() => assertPreviewVerification(value, verificationIdentity), /unexpected public content source/)
})

for (const previewUrl of [
  undefined,
  'not a URL',
  'https://rawkode.academy/',
  'https://rawkode-academy-website-pr-1419-bbbbbbbbbbbb.rawkodeacademy.workers.dev/',
  verifiedPreviewUrl.replace('https:', 'http:'),
  verifiedPreviewUrl.replace('0123abcd-', '0123abc-'),
  verifiedPreviewUrl.replace('pr-1419-', 'pr-1420-'),
  verifiedPreviewUrl.replace('bbbbbbbbbbbb', 'cccccccccccc'),
  verifiedPreviewUrl.replace('.rawkodeacademy.', '.another-account.'),
  verifiedPreviewUrl.replace('.workers.dev/', '.workers.dev.attacker.example/'),
  verifiedPreviewUrl.replace('https://', 'https://user:password@'),
  verifiedPreviewUrl.replace('.workers.dev/', '.workers.dev:8443/'),
  verifiedPreviewUrl + 'watch',
  verifiedPreviewUrl + '?marker=forged',
  verifiedPreviewUrl + '#other-origin',
]) {
  test(`preview delivery verifier rejects invalid or foreign version URL ${previewUrl}`, () => {
    assert.throws(() => assertPreviewVerification({ ...currentVerification(), previewUrl }, verificationIdentity))
  })
}
