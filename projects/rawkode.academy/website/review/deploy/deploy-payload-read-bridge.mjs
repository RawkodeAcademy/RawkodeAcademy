import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const payloadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../payload')

function run(command, args, cwd, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...extraEnv, CI: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => process.stdout.write(chunk))
    child.stderr.on('data', chunk => process.stderr.write(chunk))
    child.once('error', reject)
    child.once('close', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(command + ' ' + args.join(' ') + ' failed with exit ' + (code ?? signal ?? 'unknown')))
    })
  })
}

/**
 * Deploy the current PR's read bridge against the accepted, populated baseline.
 * The worker has no public route or workers.dev URL and exposes only the
 * PublicContentBridge GET entrypoint to the paired website service binding.
 */
export async function deployPayloadReadBridge({ identity, source }) {
  if (!identity || identity.pullRequestNumber !== source.pullRequestNumber || identity.sha !== source.sha) {
    throw new Error('The Payload read bridge code must match the current website PR/head SHA.')
  }
  if (!/^[0-9a-f]{40}$/.test(source.dataSha) || !source.databaseId || !source.databaseName || !source.bucketName) {
    throw new Error('The Payload read bridge needs a pinned data baseline and its existing D1/R2 bindings.')
  }
  if (source.entrypoint !== 'PublicContentBridge' ||
      source.workerName !== 'rawkode-academy-payload-pr-' + identity.pullRequestNumber + '-' + identity.sha.slice(0, 12) + '-content') {
    throw new Error('Refusing to deploy a public or non-PR Payload read bridge name/entrypoint.')
  }

  const runtimeDir = path.join(payloadDir, '.runtime')
  await mkdir(runtimeDir, { recursive: true })
  const suffix = randomBytes(6).toString('hex')
  const configPath = path.join(runtimeDir, 'website-read-' + identity.pullRequestNumber + '-' + suffix + '.jsonc')
  const secretsPath = path.join(runtimeDir, 'website-read-' + identity.pullRequestNumber + '-' + suffix + '.vars')

  try {
    const baseConfig = JSON.parse(await readFile(path.join(payloadDir, 'wrangler.jsonc'), 'utf8'))
    // Wrangler resolves `main` relative to the generated config file. This config
    // lives under `.runtime`, so preserve the project's original worker path.
    baseConfig.main = path.relative(
      path.dirname(configPath),
      path.resolve(payloadDir, baseConfig.main),
    )
    baseConfig.name = source.workerName
    baseConfig.workers_dev = false
    baseConfig.preview_urls = false
    delete baseConfig.routes
    delete baseConfig.previews
    delete baseConfig.workflows
    delete baseConfig.ai
    delete baseConfig.containers
    delete baseConfig.durable_objects
    delete baseConfig.exports
    delete baseConfig.assets
    baseConfig.d1_databases = [{
      binding: 'D1',
      database_id: source.databaseId,
      database_name: source.databaseName,
      remote: true,
    }]
    baseConfig.r2_buckets = [{
      binding: 'R2',
      bucket_name: source.bucketName,
      remote: true,
    }]
    baseConfig.services = [{ binding: 'WORKER_SELF_REFERENCE', service: source.workerName }]
    if (baseConfig.workers_dev !== false || baseConfig.preview_urls !== false || Object.hasOwn(baseConfig, 'routes')) {
      throw new Error('The Payload content bridge must have no public route, workers.dev URL, or version preview URL.')
    }
    baseConfig.vars = {
      ...(baseConfig.vars ?? {}),
      PAYLOAD_PREVIEW_PR: String(identity.pullRequestNumber),
      PAYLOAD_PREVIEW_SHA: identity.sha,
      PAYLOAD_PREVIEW_SOURCE_DATA_SHA: source.dataSha,
      // Payload validates a registered direct origin while loading its config.
      // This private service-only Worker has no public route; keep its required
      // auth origin on the already-registered Payload preview host.
      OIDC_DIRECT_ORIGINS: '["https://pr-local-rawkode-academy-payload.rawkodeacademy.workers.dev"]',
      OIDC_BRIDGE_ORIGINS: '[]',
      OIDC_STAFF_SUBJECTS: '[]',
      DEVELOPER_SUBJECTS: '[]',
      REVIEW_PUBLIC_MEDIA_ORIGIN: 'https://pr-local-rawkode-academy-payload.rawkodeacademy.workers.dev',
      POC_DEV_LOCAL_AUTH: 'false',
    }
    await writeFile(configPath, JSON.stringify(baseConfig, null, 2) + '\n')
    const previewPayloadSecret = randomBytes(32).toString('hex')
    const previewCallbackSecret = randomBytes(32).toString('hex')
    const previewSecrets = {
      PAYLOAD_SECRET: previewPayloadSecret,
      PIPELINE_CALLBACK_SECRET: previewCallbackSecret,
    }
    await writeFile(
      secretsPath,
      'PAYLOAD_SECRET=' + previewPayloadSecret + '\nPIPELINE_CALLBACK_SECRET=' + previewCallbackSecret + '\n',
      { mode: 0o600 },
    )

    await run('bun', ['run', 'build:worker'], payloadDir, previewSecrets)
    await run('node', [
      'scripts/wrangler.mjs',
      'deploy',
      '--config',
      configPath,
      '--secrets-file',
      secretsPath,
    ], payloadDir, previewSecrets)
    console.log('Deployed private Payload read bridge ' + source.workerName + ' using code SHA ' + source.sha + ' with read-only data baseline ' + source.dataSha + '. No migration or import was run.')
  } finally {
    await unlink(configPath).catch(() => {})
    await unlink(secretsPath).catch(() => {})
  }
}
