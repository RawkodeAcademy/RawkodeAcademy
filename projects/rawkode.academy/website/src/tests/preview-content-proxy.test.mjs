import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handlePreviewContent } from '../../scripts/preview-content-proxy.mjs'

test('forwards the public homepage projection through the isolated content bridge', async () => {
  const forwarded = []
  const sourceBinding = {
    fetch: async request => {
      forwarded.push(request)
      return new Response('homepage projection')
    },
  }

  const request = new Request('https://payload-content.internal/v1/homepage?limit=8')
  const response = await handlePreviewContent(request, sourceBinding)

  assert.equal(response.status, 200)
  assert.equal(await response.text(), 'homepage projection')
  assert.equal(forwarded.length, 1)
  assert.equal(new URL(forwarded[0].url).pathname, '/v1/homepage')
  assert.equal(new URL(forwarded[0].url).searchParams.get('limit'), '8')
})

test('keeps mutations and unknown paths outside the isolated content bridge', async () => {
  let forwarded = 0
  const sourceBinding = { fetch: async () => { forwarded += 1; return new Response('unexpected') } }

  const mutation = await handlePreviewContent(
    new Request('https://payload-content.internal/v1/homepage', { method: 'POST' }),
    sourceBinding,
  )
  const unknown = await handlePreviewContent(
    new Request('https://payload-content.internal/v1/homepage/extra'),
    sourceBinding,
  )

  assert.equal(mutation.status, 405)
  assert.equal(unknown.status, 404)
  assert.equal(forwarded, 0)
})
