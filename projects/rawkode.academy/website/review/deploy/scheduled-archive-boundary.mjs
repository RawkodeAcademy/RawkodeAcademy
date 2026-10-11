export const PRE_RELEASE_PROBE_WINDOW_MS = 25_000
export const PRE_RELEASE_REQUEST_TIMEOUT_MS = 5_000
export const PRE_RELEASE_SAFETY_MARGIN_MS = 1_000
export const PRE_RELEASE_RETRY_DELAY_MS = 250
export const PRE_RELEASE_MAX_ATTEMPTS = 4
const INITIAL_ARCHIVE_REQUEST_COUNT = 2
const INITIAL_ARCHIVE_MAX_CACHE_TTL_MS = 30_000
const INITIAL_ARCHIVE_REQUEST_RETRY_BUDGET_MS =
	PRE_RELEASE_MAX_ATTEMPTS * PRE_RELEASE_REQUEST_TIMEOUT_MS +
	(PRE_RELEASE_MAX_ATTEMPTS - 1) * PRE_RELEASE_RETRY_DELAY_MS
export const INITIAL_ARCHIVE_WARM_MIN_RUNWAY_MS =
	PRE_RELEASE_PROBE_WINDOW_MS +
	INITIAL_ARCHIVE_MAX_CACHE_TTL_MS +
	INITIAL_ARCHIVE_REQUEST_COUNT * INITIAL_ARCHIVE_REQUEST_RETRY_BUDGET_MS +
	PRE_RELEASE_SAFETY_MARGIN_MS

const defaultSleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

function isTimeout(error, signal) {
	return error?.name === 'TimeoutError' || (signal?.aborted && error?.name === 'AbortError')
}

async function fetchHtmlBeforeRelease({
	archiveUrl,
	releaseAt,
	fetchImpl,
	now,
	sleep,
	timeoutSignal,
	label,
	rotateCacheKeyOnTimeout = false,
}) {
	let lastTimeout
	let requestUrl = new URL(archiveUrl)
	let retryCacheKey = 0
	for (let attempt = 1; attempt <= PRE_RELEASE_MAX_ATTEMPTS; attempt += 1) {
		const startedAt = now()
		const availableMs = releaseAt - startedAt - PRE_RELEASE_SAFETY_MARGIN_MS
		if (availableMs <= 0) {
			throw new Error(`The pre-release ${label} request timed out; its retry window ended before the scheduled release.`)
		}

		const signal = timeoutSignal(Math.min(PRE_RELEASE_REQUEST_TIMEOUT_MS, availableMs))
		let response
		try {
			response = await fetchImpl(requestUrl, {
				headers: { accept: 'text/html' },
				signal,
			})
			const html = await response.text()
			if (now() >= releaseAt) {
				throw new Error(`The pre-release ${label} response completed at or after the scheduled release.`)
			}
			return { response, html, startedAt, archiveUrl: requestUrl }
		} catch (error) {
			await response?.body?.cancel().catch(() => {})
			if (!isTimeout(error, signal)) throw error
			lastTimeout = error

			const remainingMs = releaseAt - now() - PRE_RELEASE_SAFETY_MARGIN_MS
			if (attempt === PRE_RELEASE_MAX_ATTEMPTS || remainingMs <= 0) {
				throw new Error(
					`The pre-release ${label} request timed out after ${attempt} attempt${attempt === 1 ? '' : 's'} before ${new Date(releaseAt).toISOString()}.`,
					{ cause: lastTimeout },
				)
			}
			await sleep(Math.min(PRE_RELEASE_RETRY_DELAY_MS, remainingMs))
			if (rotateCacheKeyOnTimeout) {
				requestUrl = new URL(requestUrl)
				requestUrl.searchParams.set('cmsRetryProbe', String(++retryCacheKey))
			}
		}
	}

	throw new Error(`The pre-release ${label} request could not complete before the scheduled release.`, {
		cause: lastTimeout,
	})
}

/**
 * Warm one same-URL archive response, then prove the next response is a hidden
 * content cache HIT. Each fetch and body read is bounded so retries cannot
 * cross the scheduled publication time.
 */
export async function verifyScheduledArchiveWarm({
	archiveUrl,
	scheduledHref,
	scheduledSlug,
	publishedAt,
	releaseAt,
	fetchImpl = fetch,
	now = () => Date.now(),
	sleep = defaultSleep,
	timeoutSignal = milliseconds => AbortSignal.timeout(milliseconds),
}) {
	const runwayMs = releaseAt - now()
	if (!Number.isFinite(releaseAt) || runwayMs < INITIAL_ARCHIVE_WARM_MIN_RUNWAY_MS) {
		throw new Error(
			'The initial scheduled archive check needs at least ' +
			INITIAL_ARCHIVE_WARM_MIN_RUNWAY_MS +
			'ms before ' + publishedAt + '; only ' + Math.max(0, runwayMs) + 'ms remain.',
		)
	}

	const archiveBefore = await fetchHtmlBeforeRelease({
		archiveUrl,
		releaseAt,
		fetchImpl,
		now,
		sleep,
		timeoutSignal,
		label: 'initial archive warm',
	})
	if (!archiveBefore.response.ok || archiveBefore.html.includes(scheduledHref)) {
		throw new Error(
			'The watch archive should hide the future-dated video ' +
			scheduledSlug +
			' before ' + publishedAt + ' (HTTP ' + archiveBefore.response.status + ').',
		)
	}

	const archiveHit = await fetchHtmlBeforeRelease({
		archiveUrl,
		releaseAt,
		fetchImpl,
		now,
		sleep,
		timeoutSignal,
		label: 'initial archive cache hit',
	})
	const cacheState = archiveHit.response.headers.get('cf-cache-status')?.toUpperCase()
	if (!archiveHit.response.ok || archiveHit.html.includes(scheduledHref) || cacheState !== 'HIT') {
		throw new Error(
			'The pre-release /watch response must hide ' +
			scheduledSlug +
			' and warm Cloudflare Workers Cache on the same URL (HTTP ' +
			archiveHit.response.status +
			', CF-Cache-Status ' + (cacheState ?? 'missing') + ').',
		)
	}
}

/**
 * Re-render a warmed archive shortly before publication and verify the cache
 * still hides the scheduled link. Timeout failures are retried only while the
 * request and its body can finish before the release boundary.
 */
export async function verifyScheduledArchiveBoundary({
	archiveUrl,
	scheduledHref,
	scheduledSlug,
	publishedAt,
	releaseAt,
	fetchImpl = fetch,
	now = () => Date.now(),
	sleep = defaultSleep,
	timeoutSignal = milliseconds => AbortSignal.timeout(milliseconds),
	responseCacheAges,
}) {
	const boundaryProbeAt = releaseAt - PRE_RELEASE_PROBE_WINDOW_MS
	while (now() < boundaryProbeAt) {
		await sleep(Math.min(5_000, boundaryProbeAt - now()))
	}

	const initialSecondsUntilRelease = Math.floor((releaseAt - now()) / 1000)
	if (initialSecondsUntilRelease < 1 || initialSecondsUntilRelease > PRE_RELEASE_PROBE_WINDOW_MS / 1000) {
		throw new Error(`The scheduled archive cache probe did not run in its final ${PRE_RELEASE_PROBE_WINDOW_MS / 1000} seconds before ${publishedAt}.`)
	}

	let boundaryWarm = await fetchHtmlBeforeRelease({
		archiveUrl,
		releaseAt,
		fetchImpl,
		now,
		sleep,
		timeoutSignal,
		label: 'archive cache warm',
		// A timed-out Worker request can still finish at Cloudflare and fill its
		// cache key. Retry the boundary MISS with a fresh URL so that this late
		// fill cannot turn the first observable boundary response into a HIT.
		rotateCacheKeyOnTimeout: true,
	})
	let boundaryAges
	let secondsUntilRelease
	for (let cacheCycle = 1; cacheCycle <= PRE_RELEASE_MAX_ATTEMPTS; cacheCycle += 1) {
		secondsUntilRelease = Math.floor((releaseAt - boundaryWarm.startedAt) / 1000)
		const boundaryCacheState = boundaryWarm.response.headers.get('cf-cache-status')?.toUpperCase()
		boundaryAges = responseCacheAges(boundaryWarm.response)
		if (
			!boundaryWarm.response.ok ||
			boundaryWarm.html.includes(scheduledHref) ||
			!['MISS', 'EXPIRED'].includes(boundaryCacheState ?? '') ||
			!boundaryAges.length ||
			boundaryAges.some(age => age > secondsUntilRelease)
		) {
			throw new Error(`The pre-release /watch response must be a cache MISS without ${scheduledSlug}, with every shared TTL at or below ${secondsUntilRelease}s (HTTP ${boundaryWarm.response.status}, CF-Cache-Status ${boundaryCacheState ?? 'missing'}, TTLs ${boundaryAges.join(',') || 'missing'}).`)
		}

		const boundaryHit = await fetchHtmlBeforeRelease({
			archiveUrl: boundaryWarm.archiveUrl,
			releaseAt,
			fetchImpl,
			now,
			sleep,
			timeoutSignal,
			label: 'archive cache hit',
		})
		const hitCacheState = boundaryHit.response.headers.get('cf-cache-status')?.toUpperCase()
		if (
			boundaryHit.response.ok &&
			!boundaryHit.html.includes(scheduledHref) &&
			hitCacheState === 'HIT'
		) {
			return { secondsUntilRelease, boundaryAges, archiveUrl: boundaryWarm.archiveUrl }
		}

		// If the cache evicted the just-warmed entry, a new MISS is a valid
		// candidate only after its clipped TTL is checked on the next cycle.
		if (
			boundaryHit.response.ok &&
			!boundaryHit.html.includes(scheduledHref) &&
			['MISS', 'EXPIRED'].includes(hitCacheState ?? '')
		) {
			boundaryWarm = boundaryHit
			continue
		}

		throw new Error(`The clipped pre-release /watch response did not produce a cache HIT without ${scheduledSlug} on the same URL (HTTP ${boundaryHit.response.status}, CF-Cache-Status ${hitCacheState ?? 'missing'}).`)
	}

	throw new Error(`The clipped pre-release /watch response did not produce a cache HIT without ${scheduledSlug} on the same URL after ${PRE_RELEASE_MAX_ATTEMPTS} cache cycles.`)
}
