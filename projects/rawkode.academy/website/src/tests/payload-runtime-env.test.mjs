import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

test('Astro 6 CMS middleware uses Worker bindings without accessing removed locals.runtime.env', async () => {
  const env = { PUBLIC_SSR_CACHE_ENABLED: 'true', PAYLOAD_CONTENT: { fetch() {} } };
  let state;
  const context = vm.createContext({ Response, Request, URL, Headers, Date });
  const module = new vm.SourceTextModule(ts.transpileModule(
    readFileSync(new URL('../middleware/payload-content.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
  ).outputText, { context });
  await module.link(specifier => {
    const values = specifier === 'cloudflare:workers' ? { env }
      : specifier === 'astro:middleware' ? { defineMiddleware: handler => handler }
      : specifier === '@/lib/payload-content' ? {
        getDefaultWorkerCache: () => undefined,
        runWithPayloadRequest: (value, callback) => { state = value; return callback(); },
      } : undefined;
    assert.ok(values, specifier);
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  const response = await module.namespace.payloadContentMiddleware({
    request: new Request('https://academy.test/watch/video'),
    locals: { runtime: { get env() { throw new Error('Astro.locals.runtime.env has been removed'); } } },
  }, async () => new Response('Payload SSR', {headers: {'Content-Type': 'text/html'}}));
  assert.equal(state.env, env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'Payload SSR');
  assert.match(response.headers.get('Cache-Control'), /public/);
});
