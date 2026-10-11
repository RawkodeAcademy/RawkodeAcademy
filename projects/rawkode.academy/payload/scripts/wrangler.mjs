import { spawn } from 'node:child_process'

// OpenNext's Node-compatible server and the Payload service entrypoints need
// Node package exports (including file-type and its strtok3 dependency).
// https://opennext.js.org/cloudflare/troubleshooting
// Keep the same resolution for local runtime, dry-run, and actual deployment.
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...process.argv.slice(2)], {
  env: { ...process.env, NODE_ENV: 'production', WRANGLER_BUILD_CONDITIONS: '', WRANGLER_BUILD_PLATFORM: 'node' },
  stdio: 'inherit',
})
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
child.once('error', error => { console.error(error); process.exitCode = 1 })
child.once('close', (status, signal) => process.exit(signal ? 1 : status ?? 1))
