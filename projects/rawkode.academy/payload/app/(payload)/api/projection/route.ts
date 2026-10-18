import config from '@payload-config'
import { getPayload } from 'payload'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { oidcCsrfFailure } from '../../../../src/auth/guard'
import { isStaff } from '../../../../src/auth/access'
import { ownedCollections } from '../../../../src/projection/entries'
import { isOwnedCollection, projectCollection, publishedFrom, writeProjection } from '../../../../src/projection/project'
import type { ProjectionQueue } from '../../../../src/projection/hooks'

type Env = { CONTENT?: KVNamespace; PIPELINE_CALLBACK_SECRET?: string; PROJECTION_WORKFLOW?: ProjectionQueue }
const noStore = { 'cache-control': 'no-store' }

// POST { action: 'project', collection } — machine only (ProjectionWorkflow).
// POST { action: 'rebuild' } — staff: re-project every collection, e.g. after an import.
export async function POST(request: Request) {
  const { env } = await getCloudflareContext({ async: true }) as unknown as { env: Env }
  const machine = Boolean(env.PIPELINE_CALLBACK_SECRET) && request.headers.get('authorization') === `Bearer ${env.PIPELINE_CALLBACK_SECRET}`
  const input = await request.json().catch(() => null) as { action?: string; collection?: unknown } | null
  if (machine && input?.action === 'project') {
    if (!isOwnedCollection(input.collection)) return Response.json({ error: 'Unknown collection' }, { status: 400, headers: noStore })
    if (!env.CONTENT) return Response.json({ error: 'CONTENT KV binding is missing' }, { status: 503, headers: noStore })
    const projected = await projectCollection(input.collection, publishedFrom(await getPayload({ config })))
    await writeProjection(env.CONTENT, projected)
    if (projected.warnings.length) console.warn(JSON.stringify({ level: 'warn', message: 'projection warnings', collection: projected.collection, warnings: projected.warnings }))
    return Response.json({ entries: projected.entries.length, warnings: projected.warnings }, { headers: noStore })
  }
  const csrfFailure = await oidcCsrfFailure(request)
  if (csrfFailure) return csrfFailure
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isStaff(user)) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
  if (input?.action !== 'rebuild') return Response.json({ error: 'Unknown action' }, { status: 400, headers: noStore })
  if (!env.PROJECTION_WORKFLOW) return Response.json({ error: 'PROJECTION_WORKFLOW binding is missing' }, { status: 503, headers: noStore })
  const instance = await env.PROJECTION_WORKFLOW.create({ params: { collections: [...ownedCollections], reason: 'rebuild' } }) as { id?: string }
  return Response.json({ started: instance?.id ?? true }, { status: 202, headers: noStore })
}
