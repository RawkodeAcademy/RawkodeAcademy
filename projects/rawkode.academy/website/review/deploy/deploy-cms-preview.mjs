import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { checkAstroWorker } from '../../scripts/check-astro-worker.mjs'
import { cmsMediaReferences } from './cms-media-references.mjs'
import { deployPayloadReadBridge } from './deploy-payload-read-bridge.mjs'
import {
	ensureWebsitePreviewResources,
	namesForPullRequest,
	pullRequestIdentity,
} from '../../../payload/scripts/pr-preview-resources.mjs'
import { WEBSITE_PREVIEW_CONTENT_SOURCE } from '../../../payload/scripts/website-preview-source.mjs'

const identity = pullRequestIdentity()
const resources = await ensureWebsitePreviewResources(identity)
if (resources.pullRequestNumber !== identity.pullRequestNumber || resources.sha !== identity.sha) {
	throw new Error('The website preview resources are not keyed to this website workflow PR/SHA.')
}

const names = namesForPullRequest(identity.pullRequestNumber, identity.sha)
const seedSource = WEBSITE_PREVIEW_CONTENT_SOURCE
const source = {
	...seedSource,
	pullRequestNumber: identity.pullRequestNumber,
	workerName: names.workerName + '-content',
	sha: identity.sha,
	dataSha: seedSource.sha,
}
// The current-head read bridge uses the verified seeded data baseline; no
// data import, migration, editorial save, or scheduling fixture is run here.
const waitSeconds = 120

async function hasWebpSignature(response) {
	const reader = response.body?.getReader()
	if (!reader) return false
	const signature = []
	try {
		for (let reads = 0; reads < 8 && signature.length < 12; reads += 1) {
			const { value, done } = await reader.read()
			if (done) break
			for (const byte of value ?? []) {
				if (signature.length === 12) break
				signature.push(byte)
			}
		}
	} finally {
		await reader.cancel().catch(() => {})
		reader.releaseLock()
	}
	return (
		String.fromCharCode(...signature.slice(0, 4)) === 'RIFF' &&
		String.fromCharCode(...signature.slice(8, 12)) === 'WEBP'
	)
}

function assertPublicSsrCachePolicy(response) {
	// Cloudflare consumes and strips Cloudflare-CDN-Cache-Control before the
	// response reaches clients. Check the client-visible policies and verify
	// the actual cache HIT with CF-Cache-Status below.
	const headers = ['cache-control', 'cdn-cache-control']
		.map(name => [name, response.headers.get(name)])
		.filter(([, value]) => value)
	if (!headers.length) throw new Error('The Astro SSR response did not expose cache-control headers.')
	if (!headers.some(([name, value]) => name === 'cache-control' && /(?:^|,)\s*public(?:,|$)/i.test(value))) {
		throw new Error('The Astro SSR response is missing its public Cache-Control directive.')
	}
	let foundMaxAge = false
	for (const [name, value] of headers) {
		const directives = value.split(',').map(part => part.trim())
		if (directives.some(part => /^stale-(?:while-revalidate|if-error)(?:=|$)/i.test(part))) {
			throw new Error(`The Astro SSR ${name} header includes a stale-serving directive.`)
		}
		for (const directive of directives) {
			const key = directive.split('=', 1)[0]?.trim().toLowerCase()
			if (key !== 'max-age' && key !== 's-maxage') continue
			const rawSeconds = directive.slice(directive.indexOf('=') + 1).trim().replace(/^"|"$/g, '')
			const seconds = Number(rawSeconds)
			if (!Number.isSafeInteger(seconds) || seconds < 0 || seconds > 30) {
				throw new Error(`The Astro SSR ${name} ${key} must be between 0 and 30 seconds.`)
			}
			foundMaxAge = true
		}
	}
	if (!foundMaxAge) throw new Error('The Astro SSR response did not expose a max-age or s-maxage freshness bound.')
	const cachePolicy = response.headers.get('cache-control')?.toLowerCase() ?? ''
	if (!/(?:^|,)\s*must-revalidate(?:,|$)/i.test(cachePolicy)) {
		throw new Error('The client-visible Cache-Control policy must forbid stale responses; stale responses are not allowed.')
	}
}

async function measureSsrPage(previewUrl, pathname) {
	const startedAt = performance.now()
	const response = await fetch(new URL(pathname, previewUrl), {
		headers: { accept: 'text/html' },
		signal: AbortSignal.timeout(60_000),
	})
	const ttfbMs = performance.now() - startedAt
	const html = await response.text()
	const totalMs = performance.now() - startedAt
	const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
	if (!response.ok || !contentType.includes('text/html') || !html.includes('<html')) {
		throw new Error('Preview SSR performance probe failed for ' + pathname + ' (HTTP ' + response.status + ').')
	}
	return {
		pathname,
		ttfbMs: Math.round(ttfbMs),
		totalMs: Math.round(totalMs),
		cfCache: response.headers.get('cf-cache-status')?.toUpperCase() ?? 'missing',
		dataCache: response.headers.get('x-payload-data-cache') ?? 'missing',
		serverTiming: response.headers.get('server-timing') ?? 'missing',
	}
}

function cacheCount(value, key) {
	const match = value.match(new RegExp('(?:^|;\\s*)' + key + '=([0-9]+)'))
	return match ? Number(match[1]) : -1
}

async function verifyPreviewRenderTimings(previewUrl, identity) {
	const probe = identity.sha.slice(0, 12) + '-' + Date.now()
	const cases = [
		['cold-watch', '/watch?previewPerf=' + probe + '-watch-cold'],
		['warm-watch', '/watch?previewPerf=' + probe + '-watch-warm'],
		['edge-hit-watch', '/watch?previewPerf=' + probe + '-watch-warm'],
		['cold-home', '/?previewPerf=' + probe + '-home-cold'],
		['warm-home', '/?previewPerf=' + probe + '-home-warm'],
		['edge-hit-home', '/?previewPerf=' + probe + '-home-warm'],
	]
	const results = {}
	for (const [label, pathname] of cases) {
		results[label] = await measureSsrPage(previewUrl, pathname)
		console.log('[preview-perf] ' + label + ' ' + JSON.stringify(results[label]))
	}
	for (const label of ['cold-watch', 'warm-watch', 'edge-hit-watch', 'cold-home', 'warm-home', 'edge-hit-home']) {
		if (results[label].dataCache === 'missing' || results[label].serverTiming === 'missing') {
			throw new Error('Preview performance diagnostics were missing from ' + label + '.')
		}
	}
	for (const route of ['watch', 'home']) {
		const cold = results['cold-' + route]
		const warm = results['warm-' + route]
		const hit = results['edge-hit-' + route]
		if (cacheCount(cold.dataCache, 'misses') < 1) {
			throw new Error('The ' + route + ' cold probe did not record a Payload data-cache miss.')
		}
		if (cacheCount(warm.dataCache, 'hits') < 1 || cacheCount(warm.dataCache, 'misses') !== 0) {
			throw new Error('The ' + route + ' warm probe did not reuse the Payload data cache.')
		}
		if (!cold.serverTiming.includes('payload-find;dur=') || !cold.serverTiming.includes('payload-init;dur=')) {
			throw new Error('The ' + route + ' cold probe is missing Payload initialization/query timings.')
		}
		if (hit.cfCache !== 'HIT') {
			throw new Error('The ' + route + ' repeated probe did not hit the HTML edge cache.')
		}
	}
	if (process.env.GITHUB_STEP_SUMMARY) {
		const rows = ['cold-watch', 'warm-watch', 'edge-hit-watch', 'cold-home', 'warm-home', 'edge-hit-home']
			.map(label => {
				const item = results[label]
				return '| ' + label + ' | ' + item.ttfbMs + ' ms | ' + item.totalMs + ' ms | ' + item.cfCache + ' | ' + item.dataCache + ' |'
			})
			.join('\n')
		await appendFile(process.env.GITHUB_STEP_SUMMARY,
			'\n## Preview render timings\n\n| Probe | TTFB | Total | HTML cache | Payload data cache |\n| --- | ---: | ---: | --- | --- |\n' + rows + '\n\n')
	}
	return results
}

const configPath = path.resolve('dist/server/wrangler.json')
const bootstrapConfigPath = path.resolve('dist/server/wrangler.pr-preview-bootstrap.json')
const previewConfigPath = path.resolve('dist/server/wrangler.pr-preview.json')
const isolationConfigPath = path.resolve('dist/server/wrangler.isolation.pr-preview.json')
const { config } = await checkAstroWorker(configPath)
config.name = names.websiteWorkerName
config.workers_dev = false
config.preview_urls = true
// Never route a PR preview through the production website hostname.
delete config.routes

// Astro SSR sessions are isolated per PR/SHA. A preview must never write to
// the production SESSION namespace.
const sessions = (config.kv_namespaces ?? []).filter(binding => binding.binding === 'SESSION')
if (sessions.length !== 1 || !resources.sessionNamespaceId) {
	throw new Error('The generated Astro Worker must have exactly one SESSION KV binding and a PR-isolated namespace.')
}
sessions[0].id = resources.sessionNamespaceId
delete sessions[0].preview_id

// PR previews must not write to any production service. Keep only the three
// explicitly read-only models used by server-rendered public pages. Identity
// goes to a per-PR deny-all Worker so auth helpers cannot fall back to direct
// requests to the production identity service.
const previewReadModels = new Set(['BRACKETS_READ', 'LEADERBOARD_READ', 'ACHIEVEMENTS_READ'])
config.services = (config.services ?? []).filter(binding => previewReadModels.has(binding.binding))
config.services.push({ binding: 'IDENTITY', service: names.websiteIsolationWorkerName })
config.services.push({ binding: 'PAYLOAD_CONTENT', service: names.websiteIsolationWorkerName, entrypoint: 'PublicContentReadOnly' })
config.images = { ...(config.images ?? {}), binding: 'IMAGES' }
// Static assets must pass the preview's GET-only gateway too.
config.assets = { ...(config.assets ?? {}), run_worker_first: true }
// Applications and newsletter preferences must not send external email.
delete config.send_email
config.vars = {
	...(config.vars ?? {}),
	PAYLOAD_PREVIEW_PR: String(identity.pullRequestNumber),
	PAYLOAD_PREVIEW_SHA: identity.sha,
	PUBLIC_SSR_CACHE_ENABLED: 'true',
	PAYLOAD_PREVIEW_SOURCE_WORKER: source.workerName,
	PAYLOAD_PREVIEW_SOURCE_SHA: source.sha,
	PAYLOAD_PREVIEW_SOURCE_DATA_SHA: source.dataSha,
}
// Keep the public request gateway uncached. Only its named inner Astro entrypoint
// uses Workers Cache after the gateway has excluded credentials and interactive routes.
config.exports = { ...(config.exports ?? {}) }
config.exports.default = { ...(config.exports.default ?? {}), type: 'worker', cache: { ...(config.exports.default?.cache ?? {}), enabled: false } }
config.exports.CachedAstro = { ...(config.exports.CachedAstro ?? {}), type: 'worker', cache: { ...(config.exports.CachedAstro?.cache ?? {}), enabled: true } }

const accountId = config.account_id ?? config.vars?.CLOUDFLARE_ACCOUNT_ID
if (typeof accountId !== 'string' || !/^[0-9a-f]{32}$/i.test(accountId)) {
	throw new Error('The generated website Worker config must provide its Cloudflare account ID for the isolated identity guard.')
}
config.account_id = accountId
// Preview traces/logs must not be forwarded to the production Grafana workers.
delete config.observability
const isolationConfig = {
	name: names.websiteIsolationWorkerName,
	account_id: accountId,
	main: '../../scripts/preview-isolation-worker.mjs',
	compatibility_date: config.compatibility_date,
	compatibility_flags: config.compatibility_flags,
	workers_dev: false,
	preview_urls: false,
	services: [{ binding: 'PUBLIC_CONTENT_SOURCE', service: source.workerName, entrypoint: source.entrypoint }],
}
const bootstrapConfig = { ...config, preview_urls: true }
if (bootstrapConfig.workers_dev !== false || bootstrapConfig.preview_urls !== true || Object.hasOwn(bootstrapConfig, 'routes')) {
	throw new Error('The Astro PR Worker bootstrap must have no routes or workers.dev route, and must enable version previews.')
}
if (config.workers_dev !== false || config.preview_urls !== true || Object.hasOwn(config, 'routes')) {
	throw new Error('The Astro version preview must have no stable workers.dev route or configured route.')
}
await writeFile(bootstrapConfigPath, `${JSON.stringify(bootstrapConfig, null, 2)}\n`)
await writeFile(previewConfigPath, `${JSON.stringify(config, null, 2)}\n`)
await writeFile(isolationConfigPath, `${JSON.stringify(isolationConfig, null, 2)}\n`)

try {
	await deployPayloadReadBridge({ identity, source })

	const guard = spawn('node', [
		'node_modules/wrangler/bin/wrangler.js',
		'deploy',
		'--config',
		isolationConfigPath,
	], { env: { ...process.env, CI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'] })
	let guardStatus = 0
	guard.stdout.setEncoding('utf8')
	guard.stderr.setEncoding('utf8')
	guard.stdout.on('data', chunk => process.stdout.write(chunk))
	guard.stderr.on('data', chunk => process.stderr.write(chunk))
	guardStatus = await new Promise((resolve, reject) => {
		guard.once('error', reject)
		guard.once('close', code => resolve(code))
	})
	if (guardStatus !== 0) throw new Error(`Wrangler failed to deploy the per-PR identity isolation Worker (exit ${guardStatus}).`)

	// Wrangler versions upload requires an existing Worker. Create its PR/SHA-specific
	// script without routes or a workers.dev/preview URL; the version preview below
	// becomes the only public website URL.
	const bootstrap = spawn('node', [
		'node_modules/wrangler/bin/wrangler.js',
		'deploy',
		'--config',
		bootstrapConfigPath,
	], { env: { ...process.env, CI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'] })
	bootstrap.stdout.setEncoding('utf8')
	bootstrap.stderr.setEncoding('utf8')
	bootstrap.stdout.on('data', chunk => process.stdout.write(chunk))
	bootstrap.stderr.on('data', chunk => process.stderr.write(chunk))
	const bootstrapStatus = await new Promise((resolve, reject) => {
		bootstrap.once('error', reject)
		bootstrap.once('close', code => resolve(code))
	})
	if (bootstrapStatus !== 0) throw new Error(`Wrangler failed to bootstrap the route-less Astro PR Worker (exit ${bootstrapStatus}).`)

	const child = spawn('node', [
		'node_modules/wrangler/bin/wrangler.js',
		'versions',
		'upload',
		'--config',
		previewConfigPath,
	], { env: { ...process.env, CI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'] })
	let stdout = ''
	let stderr = ''
	child.stdout.setEncoding('utf8')
	child.stderr.setEncoding('utf8')
	child.stdout.on('data', chunk => { stdout += chunk; process.stdout.write(chunk) })
	child.stderr.on('data', chunk => { stderr += chunk; process.stderr.write(chunk) })
	const status = await new Promise((resolve, reject) => {
		child.once('error', reject)
		child.once('close', code => resolve(code))
	})
	if (status !== 0) throw new Error(`Wrangler versions upload failed with exit code ${status}.`)

	const output = `${stdout}\n${stderr}`
	const matches = [...output.matchAll(/Version Preview URL:\s*(https?:\/\/\S+)/g)]
	const previewUrl = matches.at(-1)?.[1]?.replace(/[),]+$/, '')
	if (!previewUrl) throw new Error('Wrangler did not print a Version Preview URL for the Astro SSR preview.')

	// Verify the current-head read bridge against the reused, seeded D1/R2 data without imports or migrations.
	const diagnosticUrl = new URL('/api/cms-preview-check', previewUrl)
	const diagnosticDeadline = Date.now() + Math.min(waitSeconds, 120) * 1000
	let sentinel
	let diagnosticState = 'no response'
	while (Date.now() < diagnosticDeadline) {
		try {
			const response = await fetch(diagnosticUrl, {
				method: 'GET',
				headers: { accept: 'application/json', 'cache-control': 'no-store', origin: diagnosticUrl.origin },
				signal: AbortSignal.timeout(15_000),
			})
			const body = await response.json().catch(() => null)
			if (
				response.ok &&
				body?.demoProjectionPrivate === true &&
				typeof body?.video?.id === 'string' &&
				typeof body?.video?.slug === 'string' && body.video.slug.trim() &&
				typeof body?.video?.title === 'string' && body.video.title.trim() &&
				body?.readOnly === true &&
				body?.contentSource?.worker === source.workerName &&
				body?.contentSource?.sha === source.sha
			) {
				sentinel = body.video
				break
			}
			diagnosticState = `HTTP ${response.status}, Payload preview diagnostic returned incomplete read-only content/source evidence`
		} catch (error) {
			diagnosticState = error instanceof Error ? error.message : String(error)
		}
		console.log(`Waiting for Astro PAYLOAD_CONTENT diagnostic ${source.workerName}: ${diagnosticState}`)
		await new Promise(resolve => setTimeout(resolve, 5_000))
	}
	if (!sentinel) throw new Error(`Astro preview diagnostic did not return Payload content at ${diagnosticUrl}: ${diagnosticState}`)

	// The website gateway must reject mutations before Astro or any service binding.
	for (const pathname of ['/api/cms-preview-check', '/favicon-32x32.png']) {
		for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
			const response = await fetch(new URL(pathname, previewUrl), { method, signal: AbortSignal.timeout(15_000) })
			await response.body?.cancel().catch(() => {})
			if (response.status !== 405 || response.headers.get('allow') !== 'GET') throw new Error(`Read-only website accepted ${method} at ${pathname}.`)
		}
	}
	const identityResponse = await fetch(new URL('/api/auth/sign-in', previewUrl), { redirect: 'manual', signal: AbortSignal.timeout(15_000) })
	await identityResponse.body?.cancel().catch(() => {})
	if (identityResponse.status !== 503) throw new Error('Identity must remain unavailable in the read-only website preview.')

	// Verify a route rendered the content returned by the bridge-backed
	// diagnostic before surfacing the preview URL.
	const sentinelPath = `/watch/${sentinel.slug.split('/').map(encodeURIComponent).join('/')}`
	const sentinelUrl = new URL(sentinelPath, previewUrl)
	sentinelUrl.searchParams.set('cmsCacheProbe', `${identity.sha.slice(0, 12)}-${Date.now()}`)
	const renderedDeadline = Date.now() + Math.min(waitSeconds, 120) * 1000
	let rendered = false
	let renderState = 'no response'
	while (Date.now() < renderedDeadline) {
		try {
			const response = await fetch(sentinelUrl, { headers: { accept: 'text/html' }, signal: AbortSignal.timeout(15_000) })
			const html = await response.text()
			const escapedTitle = sentinel.title.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
			if (response.ok && (html.includes(sentinel.title) || html.includes(escapedTitle))) {
				assertPublicSsrCachePolicy(response)
				const cacheProbe = await fetch(sentinelUrl, { headers: { accept: 'text/html' }, signal: AbortSignal.timeout(15_000) })
				const cacheProbeHtml = await cacheProbe.text()
				const cacheStatus = cacheProbe.headers.get('cf-cache-status')?.toUpperCase()
				if (
					cacheProbe.ok &&
					(cacheProbeHtml.includes(sentinel.title) || cacheProbeHtml.includes(escapedTitle)) &&
					cacheStatus === 'HIT'
				) {
					assertPublicSsrCachePolicy(cacheProbe)
					const cookieProbe = await fetch(sentinelUrl, {
						headers: { accept: 'text/html', cookie: 'rawkode-session=cache-bypass-probe' },
						signal: AbortSignal.timeout(15_000),
					})
					const cookieProbeHtml = await cookieProbe.text()
					const cookieCacheControl = cookieProbe.headers.get('cache-control')?.toLowerCase() ?? ''
					const cookieCacheState = cookieProbe.headers.get('x-website-cache-route')?.toUpperCase()
					const cookieEdgeCacheState = cookieProbe.headers.get('cf-cache-status')?.toUpperCase()
					if (
						!cookieProbe.ok ||
						(!cookieProbeHtml.includes(sentinel.title) && !cookieProbeHtml.includes(escapedTitle)) ||
						cookieCacheState !== 'BYPASS' ||
						cookieEdgeCacheState === 'HIT' ||
						!/(?:^|,)\s*private(?:,|$)/i.test(cookieCacheControl) ||
						!/(?:^|,)\s*no-store(?:,|$)/i.test(cookieCacheControl)
					) {
						throw new Error(`Cookie-bearing Astro requests must bypass the public response cache and return private, no-store responses (HTTP ${cookieProbe.status}, gateway ${cookieCacheState ?? 'missing'}, edge ${cookieEdgeCacheState ?? 'missing'}, Cache-Control ${cookieCacheControl || 'missing'}).`)
					}
					for (const [label, authHeaders] of [
						['Authorization', { authorization: 'Bearer preview-cache-bypass' }],
						['Cloudflare Access', { 'cf-access-jwt-assertion': 'preview-cache-bypass' }],
					]) {
						const privateProbe = await fetch(sentinelUrl, { headers: { accept: 'text/html', ...authHeaders }, signal: AbortSignal.timeout(15_000) })
						const privateHeaders = privateProbe.headers.get('cache-control')?.toLowerCase() ?? ''
						const privateRoute = privateProbe.headers.get('x-website-cache-route')?.toUpperCase()
						const privateEdge = privateProbe.headers.get('cf-cache-status')?.toUpperCase()
						await privateProbe.body?.cancel().catch(() => {})
						if (privateRoute !== 'BYPASS' || privateEdge === 'HIT' || !/(?:^|,)\s*private(?:,|$)/i.test(privateHeaders) || !/(?:^|,)\s*no-store(?:,|$)/i.test(privateHeaders)) {
							throw new Error(`${label}-bearing Astro requests must bypass Workers Cache and return private, no-store responses.`)
						}
					}
					rendered = true
					break
				}
				renderState = `SSR rendered, but the second request did not hit Cloudflare Workers Cache (HTTP ${cacheProbe.status}, CF-Cache-Status ${cacheStatus ?? 'missing'})`
			}
			else renderState = `HTTP ${response.status}, expected Payload video title was absent from SSR HTML`
		} catch (error) {
			renderState = error instanceof Error ? error.message : String(error)
		}
		console.log(`Waiting for Astro SSR to render Payload sentinel ${sentinel.slug}: ${renderState}`)
		await new Promise(resolve => setTimeout(resolve, 5_000))
	}
	if (!rendered) throw new Error(`Astro preview SSR/cache checks did not pass at ${sentinelUrl}: ${renderState}`)
	console.log(`SSR content and cache checks passed: ${sentinelPath} rendered Payload video “${sentinel.title}”; a repeat request hit Cloudflare Workers Cache, while cookie, Authorization, and Cloudflare Access requests bypassed it. Public TTL is at most 30 seconds.`)

	await verifyPreviewRenderTimings(previewUrl, identity)

	// This imported course demo proves its title and file contents come through
	// the Payload-only endpoint on the SSR route. COOP/COEP are required by the
	// browser WebContainer runtime and are added by the embed route middleware.
	const webContainerPath = '/embed/webcontainer?course=complete-guide-zitadel&module=01-introduction&resource=oauth-pkce-app'
	const webContainerUrl = new URL(webContainerPath, previewUrl)
	const webContainerDeadline = Date.now() + Math.min(waitSeconds, 120) * 1000
	let webContainerReady = false
	let webContainerState = 'no response'
	while (Date.now() < webContainerDeadline) {
		try {
			const response = await fetch(webContainerUrl, {
				headers: { accept: 'text/html' },
				signal: AbortSignal.timeout(15_000),
			})
			const html = await response.text()
			const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
			const titleRendered = title.includes('OAuth PKCE Interactive Demo')
			const demoContentRendered = html.includes('public/index.html') && html.includes('OAuth PKCE Authentication')
			const coop = response.headers.get('cross-origin-opener-policy')?.toLowerCase()
			const coep = response.headers.get('cross-origin-embedder-policy')?.toLowerCase()
			if (response.ok && titleRendered && demoContentRendered && coop === 'same-origin' && coep === 'require-corp') {
				webContainerReady = true
				break
			}
			webContainerState = `HTTP ${response.status}, title ${titleRendered ? 'present' : 'missing'}, demo file content ${demoContentRendered ? 'present' : 'missing'}, COOP ${coop ?? 'missing'}, COEP ${coep ?? 'missing'}`
		} catch (error) {
			webContainerState = error instanceof Error ? error.message : String(error)
		}
		console.log(`Waiting for the Payload-backed WebContainer SSR route ${webContainerPath}: ${webContainerState}`)
		await new Promise(resolve => setTimeout(resolve, 5_000))
	}
	if (!webContainerReady) {
		throw new Error(`The Payload-backed WebContainer SSR check failed at ${webContainerUrl}: ${webContainerState}`)
	}
	console.log('Ordinary summary/full content projections omit demo source files and local import paths.');
	console.log(`WebContainer SSR check passed: ${webContainerPath} rendered the imported demo title and file content with COOP same-origin and COEP require-corp.`)


	// The seeded article exercises the CMS runtime D2 source hash and the same
	// immutable media URL contract used by article covers and body images.
	const articlePath = '/read/federated-graphql-microservices'
	const articleUrl = new URL(articlePath, previewUrl)
	const articleDeadline = Date.now() + Math.min(waitSeconds, 120) * 1000
	let articleHtml
	let diagramUrl
	let assetUrl
	let articleState = 'no response'
	while (Date.now() < articleDeadline) {
		try {
			const response = await fetch(articleUrl, {
				headers: { accept: 'text/html', 'cache-control': 'no-store' },
				signal: AbortSignal.timeout(15_000),
			})
			const html = await response.text()
			const { diagramUrl: diagram, assetUrl: asset } = cmsMediaReferences(html, previewUrl)
			if (response.ok && diagram && asset) {
				articleHtml = html
				diagramUrl = diagram
				assetUrl = asset
				break
			}
			articleState = `HTTP ${response.status}, article SSR was missing a D2 diagram or CMS image URL`
		} catch (error) {
			articleState = error instanceof Error ? error.message : String(error)
		}
		console.log(`Waiting for Astro D2 and CMS image SSR ${articlePath}: ${articleState}`)
		await new Promise(resolve => setTimeout(resolve, 5_000))
	}
	if (!articleHtml || !diagramUrl || !assetUrl) {
		throw new Error(`Astro preview did not render seeded D2 and CMS image URLs at ${articleUrl}: ${articleState}`)
	}
	if (diagramUrl.origin !== new URL(previewUrl).origin || assetUrl.origin !== new URL(previewUrl).origin) {
		throw new Error('Astro CMS media references must resolve to the isolated website preview origin.')
	}
	const sourceHash = diagramUrl.pathname.match(/\/cms-diagrams\/([a-f0-9]{64})\.svg$/i)?.[1]
	const assetChecksum = assetUrl.searchParams.get('v')
	const assetWidth = Number(assetUrl.searchParams.get('w'))
	if (
		!sourceHash ||
		!assetChecksum ||
		!/^[a-f0-9]{64}$/i.test(assetChecksum) ||
		![320, 640, 960, 1280, 1600, 2048].includes(assetWidth)
	) {
		throw new Error('The article SSR media references are missing valid D2 or image checksums.')
	}

	const diagramDeadline = Date.now() + Math.min(waitSeconds, 120) * 1000
	let diagramReady = false
	let diagramState = 'no response'
	while (Date.now() < diagramDeadline) {
		try {
			const response = await fetch(diagramUrl, {
				headers: { accept: 'image/svg+xml' },
				signal: AbortSignal.timeout(15_000),
			})
			const contentType = response.headers.get('content-type')?.split(';')[0]?.trim()
			const returnedSourceHash = response.headers.get('x-source-checksum')
			const returnedSvgChecksum = response.headers.get('x-content-checksum')
			const etag = response.headers.get('etag')?.replace(/^W\//, '').replace(/^"|"$/g, '')
			const svg = response.ok && contentType === 'image/svg+xml' ? await response.text() : ''
			const actualChecksum = svg ? createHash('sha256').update(svg.trim()).digest('hex') : ''
			if (
				response.ok &&
				contentType === 'image/svg+xml' &&
				returnedSourceHash === sourceHash &&
				/^[a-f0-9]{64}$/i.test(returnedSvgChecksum ?? '') &&
				etag === returnedSvgChecksum &&
				actualChecksum === returnedSvgChecksum &&
				svg.trim().startsWith('<svg') && svg.trim().endsWith('</svg>')
			) {
				await response.body?.cancel().catch(() => {})
				const cacheProbe = await fetch(diagramUrl, {
					headers: { accept: 'image/svg+xml' },
					signal: AbortSignal.timeout(15_000),
				})
				const cacheStatus = cacheProbe.headers.get('cf-cache-status')?.toUpperCase()
				const cacheProbeEtag = cacheProbe.headers.get('etag')?.replace(/^W\//, '').replace(/^"|"$/g, '')
				await cacheProbe.body?.cancel().catch(() => {})
				if (cacheProbe.ok && cacheProbeEtag === returnedSvgChecksum && cacheStatus === 'HIT') {
					diagramReady = true
					break
				}
				diagramState = `D2 SVG passed, but its second request did not hit Cloudflare Workers Cache (HTTP ${cacheProbe.status}, CF-Cache-Status ${cacheStatus ?? 'missing'})`
			}
			else diagramState = `HTTP ${response.status}, D2 SVG type/checksum headers were missing or mismatched`
		} catch (error) {
			diagramState = error instanceof Error ? error.message : String(error)
		}
		console.log(`Waiting for CMS D2 artifact ${sourceHash}: ${diagramState}`)
		await new Promise(resolve => setTimeout(resolve, 5_000))
	}
	if (!diagramReady) throw new Error(`Astro preview did not serve a checksum-verified D2 SVG at ${diagramUrl}: ${diagramState}`)

	const imageDeadline = Date.now() + Math.min(waitSeconds, 120) * 1000
	const expectedImageEtag = `${assetChecksum.toLowerCase()}-${assetWidth}-webp`
	let imageReady = false
	let imageState = 'no response'
	while (Date.now() < imageDeadline) {
		try {
			const response = await fetch(assetUrl, {
				headers: { accept: 'image/webp' },
				signal: AbortSignal.timeout(15_000),
			})
			const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
			const etag = response.headers.get('etag')?.replace(/^W\//, '').replace(/^"|"$/g, '').toLowerCase()
			const signatureValid =
				response.ok &&
				contentType === 'image/webp' &&
				etag === expectedImageEtag
				? await hasWebpSignature(response)
				: false
			if (response.ok && contentType === 'image/webp' && etag === expectedImageEtag && signatureValid) {
				const cacheProbe = await fetch(assetUrl, {
					headers: { accept: 'image/webp' },
					signal: AbortSignal.timeout(15_000),
				})
				const cacheStatus = cacheProbe.headers.get('cf-cache-status')?.toUpperCase()
				const cacheProbeEtag = cacheProbe.headers.get('etag')?.replace(/^W\//, '').replace(/^"|"$/g, '').toLowerCase()
				await cacheProbe.body?.cancel().catch(() => {})
				if (cacheProbe.ok && cacheProbeEtag === expectedImageEtag && cacheStatus === 'HIT') {
					imageReady = true
					break
				}
				imageState = `WebP transform passed, but its second request did not hit Cloudflare Workers Cache (HTTP ${cacheProbe.status}, CF-Cache-Status ${cacheStatus ?? 'missing'})`
				await response.body?.cancel().catch(() => {})
			} else {
				await response.body?.cancel().catch(() => {})
				imageState = `HTTP ${response.status}, expected image/webp with ETag ending -${assetWidth}-webp and a RIFF/WEBP body signature; received ${contentType ?? 'no content type'} and ${etag ?? 'no ETag'}`
			}
		} catch (error) {
			imageState = error instanceof Error ? error.message : String(error)
		}
		console.log(`Waiting for Cloudflare Images transform ${assetUrl.pathname}: ${imageState}`)
		await new Promise(resolve => setTimeout(resolve, 5_000))
	}
	if (!imageReady) {
		throw new Error(`Astro preview did not serve a verified Cloudflare Images WebP transform at ${assetUrl}: ${imageState}`)
	}
	console.log(`CMS media checks passed: D2 SVG ${sourceHash} and Cloudflare Images WebP ${assetUrl.pathname} at ${assetWidth}px.`)

	await writeFile(path.resolve('dist/server/website-preview-verification.json'), `${JSON.stringify({
		pullRequestNumber: identity.pullRequestNumber,
		websiteSha: identity.sha,
		previewUrl,
		contentSource: source,
		readOnly: true,
	})}\n`)
	console.log(`Version Preview URL: ${previewUrl}`)
	if (process.env.GITHUB_OUTPUT) {
		await appendFile(process.env.GITHUB_OUTPUT, `website_preview_url=${previewUrl}\nwebsite_preview_worker=${names.websiteWorkerName}\n`)
	}
	if (process.env.GITHUB_STEP_SUMMARY) {
		await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Website preview\n\n[Open the read-only Astro SSR preview](${previewUrl})\n\nWebsite PR/head: \`${identity.pullRequestNumber}/${identity.sha}\`. Current-head Payload code: \`${source.workerName}#${source.entrypoint}\` at \`${source.sha}\`, backed by seeded D1/R2 data from \`${source.dataSha}\`. GET-only access, SSR video, public Workers Cache HIT, credential cache bypass, sanitized demo projections, WebContainer SSR, checksum-verified D2 SVG and Cloudflare Images WebP passed. No content import or migration ran. Scheduling mutations and editorial saves are outside this read-only preview.\n`)

	}
} finally {
	await unlink(bootstrapConfigPath).catch(() => {})
	await unlink(previewConfigPath).catch(() => {})
	await unlink(isolationConfigPath).catch(() => {})
}
