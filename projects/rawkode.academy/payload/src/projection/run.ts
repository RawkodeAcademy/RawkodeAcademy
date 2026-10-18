import type { OwnedCollection } from './entries'
import { purgeTags } from './project'
import { purgeCacheTags, type PurgeEnv } from './purge'

export type ProjectionParams = {
  collections: OwnedCollection[]
  reason: string
  // A scheduled release: purge again when it goes live.
  releaseAt?: string
}

export type ProjectionDependencies = {
  project: (collection: OwnedCollection) => Promise<{ entries: number; warnings: string[] }>
  env: PurgeEnv
  fetcher?: typeof fetch
}

// The subset of WorkflowStep the projection uses, so it runs in tests.
export type ProjectionStep = {
  do<T>(name: string, run: () => Promise<T>): Promise<T>
  sleep(name: string, duration: string): Promise<void>
  sleepUntil(name: string, at: Date): Promise<void>
}

// KV is eventually consistent for up to a minute, so a page re-rendered right
// after the first purge can still read the old projection. A second purge
// once KV has settled removes anything cached in that window.
export const kvSettle = '75 seconds'

export async function runProjection(deps: ProjectionDependencies, params: ProjectionParams, step: ProjectionStep, now = () => Date.now()) {
  const projected: Record<string, { entries: number; warnings: string[] }> = {}
  for (const collection of params.collections) {
    projected[collection] = await step.do(`project ${collection}`, () => deps.project(collection))
  }
  const tags = [...new Set(params.collections.flatMap(collection => purgeTags[collection]))]
  const purge = (name: string) => step.do(name, () => purgeCacheTags(deps.env, tags, deps.fetcher))
  const first = await purge('purge cache')
  if (first === 'purged') {
    await step.sleep('wait for KV to settle', kvSettle)
    await purge('purge cache again')
  }
  if (params.releaseAt && Date.parse(params.releaseAt) > now()) {
    await step.sleepUntil('wait for release', new Date(params.releaseAt))
    await purge('purge cache at release')
  }
  return { projected, tags, purge: first }
}
