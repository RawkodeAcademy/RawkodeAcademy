import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers'
import { runProjection, type ProjectionDependencies, type ProjectionParams } from './run'

type Env = { WORKER_SELF_REFERENCE: Fetcher; PIPELINE_CALLBACK_SECRET: string; CACHE_PURGE_TOKEN?: string; CACHE_PURGE_ZONE_ID?: string }

// Projects published content to KV and purges the edge cache. Projection runs
// inside the Payload app (it needs the Payload API), reached over the Worker's
// self-reference with the machine secret, so each step retries on its own.
export class ProjectionWorkflow extends WorkflowEntrypoint<Env, ProjectionParams> {
  async run(event: WorkflowEvent<ProjectionParams>, step: WorkflowStep) {
    const dependencies: ProjectionDependencies = {
      project: async collection => {
        const response = await this.env.WORKER_SELF_REFERENCE.fetch('https://projection.internal/api/projection', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${this.env.PIPELINE_CALLBACK_SECRET}` },
          body: JSON.stringify({ action: 'project', collection }),
        })
        if (!response.ok) throw new Error(`Projecting ${collection} failed: ${response.status} ${await response.text()}`)
        return await response.json() as { entries: number; warnings: string[] }
      },
      env: this.env,
    }
    return runProjection(dependencies, event.payload, {
      do: (name, run) => step.do(name, { retries: { limit: 5, delay: '5 seconds', backoff: 'exponential' } }, run as never) as never,
      sleep: (name, duration) => step.sleep(name, duration as never),
      sleepUntil: (name, at) => step.sleepUntil(name, at),
    })
  }
}
