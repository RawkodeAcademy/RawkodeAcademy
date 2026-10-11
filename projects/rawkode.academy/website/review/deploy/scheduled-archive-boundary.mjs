export const PRE_RELEASE_PROBE_WINDOW_MS = 25_000
export const PRE_RELEASE_REQUEST_TIMEOUT_MS = 5_000
export const PRE_RELEASE_SAFETY_MARGIN_MS = 1_000
export const PRE_RELEASE_RETRY_DELAY_MS = 250
export const PRE_RELEASE_MAX_ATTEMPTS = 4

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
}) {
	let lastTimeout
	for (let attempt = 1; attempt <= PRE_RELEASE_MAX_ATTEMPTS; attempt += 1) {
		const startedAt = now()
		const availableMs = releaseAt - startedAt - PRE_RELEASE_SAFETY_MARGIN_MS
		if (availableMs <= 0) {
			throw new Error(`The pre-release ${label} request timed out; its retry window ended before the scheduled release.`)
		}

		const signal = timeoutSignal(Math.min(PRE_RELEASE_REQUEST_TIMEOUT_MS, availableMs))
		let response
		try {
			response = await fetchImpl(archiveUrl, {
				headers: { accept: 'text/html' },
				signal,
			})
			const html = await response.text()
			if (now() >= releaseAt) {
				throw new Error(`The pre-release ${label} response completed at or after the scheduled release.`)
			}
			return { response, html, startedAt }
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
		}
	}

	throw new Error(`The pre-release ${label} request could not complete before the scheduled release.`, {
		cause: lastTimeout,
	})
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

	const boundaryWarm = await fetchHtmlBeforeRelease({
		archiveUrl,
		releaseAt,
		fetchImpl,
		now,
		sleep,
		timeoutSignal,
		label: 'archive cache warm',
	})
	const secondsUntilRelease = Math.floor((releaseAt - boundaryWarm.startedAt) / 1000)
	const boundaryCacheState = boundaryWarm.response.headers.get('cf-cache-status')?.toUpperCase()
	const boundaryAges = responseCacheAges(boundaryWarm.response)
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
		archiveUrl,
		releaseAt,
		fetchImpl,
		now,
		sleep,
		timeoutSignal,
		label: 'archive cache hit',
	})
	const hitCacheState = boundaryHit.response.headers.get('cf-cache-status')?.toUpperCase()
	if (
		!boundaryHit.response.ok ||
		boundaryHit.html.includes(scheduledHref) ||
		hitCacheState !== 'HIT'
	) {
		throw new Error(`The clipped pre-release /watch response did not produce a cache HIT without ${scheduledSlug} on the same URL (HTTP ${boundaryHit.response.status}, CF-Cache-Status ${hitCacheState ?? 'missing'}).`)
	}

	return { secondsUntilRelease, boundaryAges }
}
