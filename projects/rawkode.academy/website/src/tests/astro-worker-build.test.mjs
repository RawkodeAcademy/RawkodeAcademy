import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { checkAstroWorker } from '../../scripts/check-astro-worker.mjs'

async function fixture(t, entry, modules = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'astro-worker-build-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const configPath = path.join(directory, 'wrangler.json')
  await writeFile(configPath, JSON.stringify({
    compatibility_date: '2026-03-12', main: 'entry.mjs',
    exports: { default: { type: 'worker', cache: { enabled: false } }, CachedAstro: { type: 'worker' } },
  }))
  await writeFile(path.join(directory, 'entry.mjs'), entry)
  for (const [name, source] of Object.entries(modules)) await writeFile(path.join(directory, name), source)
  return configPath
}

test('accepts Vite split entrypoint with renamed exports and cyclic static imports', async t => {
  const configPath = await fixture(t, 'import { C, w } from "./worker.mjs"; export { C as CachedAstro, w as default };', {
    'worker.mjs': 'import "cloudflare:workers"; import "./entry.mjs"; class C {}; const w = env.PUBLIC_SSR_CACHE_ENABLED; export { C, w };',
  })
  assert.equal((await checkAstroWorker(configPath)).modules, 2)
})

test('accepts direct and re-exported worker implementations', async t => {
  const direct = await fixture(t, 'export class CachedAstro {}; const flag = env.PUBLIC_SSR_CACHE_ENABLED;')
  assert.equal((await checkAstroWorker(direct)).modules, 1)
  const split = await fixture(t, 'export { CachedAstro } from "./worker.mjs";', {
    'worker.mjs': 'export class CachedAstro {}; const flag = env.PUBLIC_SSR_CACHE_ENABLED;',
  })
  assert.equal((await checkAstroWorker(split)).modules, 2)
})

test('rejects unrelated output containing the gateway flag', async t => {
  const configPath = await fixture(t, 'export class CachedAstro {}', {
    'unused.mjs': 'const flag = env.PUBLIC_SSR_CACHE_ENABLED;',
  })
  await assert.rejects(checkAstroWorker(configPath), /module graph/)
})

test('rejects missing named export even when its name appears in a comment', async t => {
  const configPath = await fixture(t, '// CachedAstro\nconst flag = env.PUBLIC_SSR_CACHE_ENABLED; export default {};')
  await assert.rejects(checkAstroWorker(configPath), /module graph/)
})

test('rejects missing implementation chunks', async t => {
  const configPath = await fixture(t, 'export { CachedAstro } from "./missing.mjs";')
  await assert.rejects(checkAstroWorker(configPath), /ENOENT/)
})

test('does not mistake a comment for the cache gateway setting', async t => {
  const configPath = await fixture(t, 'export class CachedAstro {} // PUBLIC_SSR_CACHE_ENABLED')
  await assert.rejects(checkAstroWorker(configPath), /module graph/)
})

test('still rejects a shared-cache-enabled request gateway', async t => {
  const configPath = await fixture(t, 'export class CachedAstro {}; const flag = env.PUBLIC_SSR_CACHE_ENABLED;')
  await writeFile(configPath, JSON.stringify({ compatibility_date: '2026-03-12', main: 'entry.mjs', exports: {
    default: { type: 'worker', cache: { enabled: true } }, CachedAstro: { type: 'worker' },
  } }))
  await assert.rejects(checkAstroWorker(configPath), /uncached default gateway/)
})
