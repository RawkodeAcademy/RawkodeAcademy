import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const outdir = await mkdtemp(path.join(tmpdir(), 'payload-worker-bundle-'))
try {
  // Compile the actual custom Worker, including Payload service entrypoints.
  // This check never uploads or connects to D1/R2. Container image builds are
  // separate from JS bundling; only this dry-run skips their rollout.
  execFileSync(process.execPath, [
    'scripts/wrangler.mjs', 'deploy', '--dry-run', '--containers-rollout', 'none', '--outdir', outdir,
  ], { stdio: 'inherit' })
  if (!(await stat(path.join(outdir, 'worker.js'))).size) throw new Error('Wrangler emitted an empty Worker bundle.')
  console.log('Payload deployment Worker bundle verified (dry-run; no upload).')
} finally {
  await rm(outdir, { recursive: true, force: true })
}
