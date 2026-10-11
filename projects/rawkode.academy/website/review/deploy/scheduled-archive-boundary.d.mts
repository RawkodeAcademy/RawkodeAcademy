export const PRE_RELEASE_PROBE_WINDOW_MS: number
export const PRE_RELEASE_REQUEST_TIMEOUT_MS: number
export const PRE_RELEASE_SAFETY_MARGIN_MS: number
export const PRE_RELEASE_RETRY_DELAY_MS: number
export const PRE_RELEASE_MAX_ATTEMPTS: number

export function verifyScheduledArchiveBoundary(options: {
	archiveUrl: URL
	scheduledHref: string
	scheduledSlug: string
	publishedAt: string
	releaseAt: number
	fetchImpl?: typeof fetch
	now?: () => number
	sleep?: (milliseconds: number) => Promise<void>
	timeoutSignal?: (milliseconds: number) => AbortSignal
	responseCacheAges: (response: Response) => number[]
}): Promise<{ secondsUntilRelease: number; boundaryAges: number[] }>
