import assert from 'node:assert/strict'
import test from 'node:test'
import { cmsMediaReferences } from '../../review/deploy/cms-media-references.mjs'

const baseUrl = 'https://isolated-preview.example/'
const hash = 'a'.repeat(64)
const diagram = `/cms-diagrams/${hash}.svg`
const asset = `/cms-assets/abcdefgh?v=${hash}`

for (const separator of ['&amp;', '&#38;', '&#x26;', '&']) {
  test(`reads rendered CMS image query parameters with ${separator}`, () => {
    const result = cmsMediaReferences(`<img src="${diagram}"><img src="${asset}${separator}w=1280">`, baseUrl)
    assert.equal(result.diagramUrl.href, new URL(diagram, baseUrl).href)
    assert.equal(result.assetUrl.searchParams.get('v'), hash)
    assert.equal(result.assetUrl.searchParams.get('w'), '1280')
  })
}

test('selects rendered attributes rather than earlier metadata or JSON-LD strings', () => {
  const html = `<meta content="https://production.example${asset}&#38;w=99">
    <script type="application/ld+json">{"image":"${asset}&w=99"}</script>
    <a href="http://[invalid">Unrelated link</a><a href="${diagram}">Diagram</a>
    <img src="${asset}&#38;w=640">`
  const result = cmsMediaReferences(html, baseUrl)
  assert.equal(result.assetUrl.origin, new URL(baseUrl).origin)
  assert.equal(result.assetUrl.searchParams.get('w'), '640')
  assert.equal(result.diagramUrl.pathname, diagram)
})

test('does not treat JSON or plain text as rendered media', () => {
  assert.deepEqual(cmsMediaReferences(`<script>{"image":"${asset}&w=1280"}</script>${diagram}`, baseUrl), {
    diagramUrl: undefined, assetUrl: undefined,
  })
})

test('preserves foreign origins so the caller can reject non-isolated media', () => {
  const result = cmsMediaReferences(`<img src="https://production.example${asset}&#38;w=1280">`, baseUrl)
  assert.equal(result.assetUrl.origin, 'https://production.example')
})

test('decodes entities only once rather than repairing an invalid rendered URL', () => {
  const result = cmsMediaReferences(`<img src="${asset}&amp;#38;w=1280">`, baseUrl)
  assert.equal(result.assetUrl.searchParams.get('w'), null)
})
