// @vitest-environment node
import { expect, test } from "vitest";
import {
	INITIAL_ARCHIVE_WARM_MIN_RUNWAY_MS,
	PRE_RELEASE_MAX_ATTEMPTS,
	PRE_RELEASE_PROBE_WINDOW_MS,
	PRE_RELEASE_REQUEST_TIMEOUT_MS,
	PRE_RELEASE_SAFETY_MARGIN_MS,
	verifyScheduledArchiveBoundary,
	verifyScheduledArchiveWarm,
} from "../deploy/scheduled-archive-boundary.mjs";

function timeoutError() {
	const error = new Error("request timed out");
	error.name = "TimeoutError";
	return error;
}

function requestTimeout(init?: RequestInit): number {
	if (!init?.signal) throw new Error("Expected a bounded request signal");
	return (init.signal as AbortSignal & { timeoutMs: number }).timeoutMs;
}

function archiveResponse(cacheStatus: "MISS" | "HIT", html: string, ttlSeconds = 10) {
	return new Response(html, {
		status: 200,
		headers: {
			"cf-cache-status": cacheStatus,
			"x-test-ttl": String(ttlSeconds),
		},
	});
}

function verifyOptions(
	releaseAt: number,
	now: () => number,
	fetchImpl: typeof fetch,
) {
	return {
		archiveUrl: new URL("https://preview.example/watch?probe=one"),
		scheduledHref: "/watch/future-video",
		scheduledSlug: "future-video",
		publishedAt: new Date(releaseAt).toISOString(),
		releaseAt,
		fetchImpl,
		now,
		sleep: async (milliseconds: number) => {
			currentTime += milliseconds;
		},
		timeoutSignal: (milliseconds: number) => Object.assign(new AbortController().signal, { timeoutMs: milliseconds }),
		responseCacheAges: (response: Response) => [Number(response.headers.get("x-test-ttl"))],
	};
}

let currentTime = 0;

test("retries a timed out boundary warm on a fresh URL, then proves that URL is a hidden-content cache HIT", async () => {
	currentTime = 0;
	const releaseAt = 30_000;
	const requestUrls: string[] = [];
	const timeoutBounds: Array<{ timeout: number; available: number }> = [];
	const cachedUrls = new Set<string>();
	let attempts = 0;
	const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
		const requestUrl = String(input);
		requestUrls.push(requestUrl);
		attempts += 1;
		const timeoutMs = requestTimeout(init);
		timeoutBounds.push({
			timeout: timeoutMs,
			available: releaseAt - currentTime - PRE_RELEASE_SAFETY_MARGIN_MS,
		});
		if (attempts === 1) {
			// The caller times out, but the Worker continues and fills the
			// abandoned key before the retry reaches the edge.
			cachedUrls.add(requestUrl);
			currentTime += timeoutMs + 6_000;
			throw timeoutError();
		}
		if (cachedUrls.has(requestUrl)) {
			return archiveResponse("HIT", "<html>archive, future link absent</html>", 13);
		}
		cachedUrls.add(requestUrl);
		return archiveResponse("MISS", "<html>archive, future link absent</html>", 13);
	}) as typeof fetch;

	const result = await verifyScheduledArchiveBoundary(verifyOptions(releaseAt, () => currentTime, fetchImpl));

	expect(attempts).toBe(3);
	expect(requestUrls[0]).toBe("https://preview.example/watch?probe=one");
	expect(requestUrls[1]).not.toBe(requestUrls[0]);
	expect(new URL(requestUrls[1]!).searchParams.get("cmsRetryProbe")).toBe("1");
	expect(requestUrls[2]).toBe(requestUrls[1]);
	expect(result.archiveUrl.toString()).toBe(requestUrls[1]);
	expect(timeoutBounds[0]?.timeout).toBe(PRE_RELEASE_REQUEST_TIMEOUT_MS);
	expect(timeoutBounds.every(({ timeout, available }) => timeout <= available)).toBe(true);
	expect(result.secondsUntilRelease).toBe(13);
	expect(result.boundaryAges).toEqual([13]);
	expect(currentTime).toBeLessThan(releaseAt);
});

test("caps a near-boundary timeout and fails before the release instead of crossing it", async () => {
	currentTime = 28_000;
	const releaseAt = 30_000;
	let attempts = 0;
	let timeoutMs = 0;
	const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
		attempts += 1;
		timeoutMs = requestTimeout(init);
		currentTime += timeoutMs;
		throw timeoutError();
	}) as typeof fetch;

	await expect(
		verifyScheduledArchiveBoundary(verifyOptions(releaseAt, () => currentTime, fetchImpl)),
	).rejects.toThrow(/timed out after 1 attempt/);

	expect(attempts).toBe(1);
	expect(timeoutMs).toBe(releaseAt - 28_000 - PRE_RELEASE_SAFETY_MARGIN_MS);
	expect(currentTime).toBe(releaseAt - PRE_RELEASE_SAFETY_MARGIN_MS);
	expect(currentTime).toBeLessThan(releaseAt);
});

test("revalidates a fresh MISS returned by the boundary HIT step before requiring HIT", async () => {
	currentTime = 0;
	const releaseAt = 30_000;
	const requestUrls: string[] = [];
	let attempts = 0;
	const fetchImpl = (async (input: RequestInfo | URL) => {
		requestUrls.push(String(input));
		attempts += 1;
		return attempts < 3
			? archiveResponse("MISS", "<html>archive, future link absent</html>", 25)
			: archiveResponse("HIT", "<html>archive, future link absent</html>", 25);
	}) as typeof fetch;

	const result = await verifyScheduledArchiveBoundary(verifyOptions(releaseAt, () => currentTime, fetchImpl));

	expect(attempts).toBe(3);
	expect(new Set(requestUrls)).toEqual(new Set(["https://preview.example/watch?probe=one"]));
	expect(result.secondsUntilRelease).toBe(25);
	expect(result.boundaryAges).toEqual([25]);
	expect(result.archiveUrl.toString()).toBe("https://preview.example/watch?probe=one");
	expect(currentTime).toBeLessThan(releaseAt);
});

test("rejects a response body that finishes at the release boundary", async () => {
	currentTime = 5_000;
	const releaseAt = 30_000;
	let attempts = 0;
	const fetchImpl = (async () => {
		attempts += 1;
		const response = archiveResponse("MISS", "<html>archive</html>");
		response.text = async () => {
			currentTime = releaseAt;
			return "<html>archive</html>";
		};
		return response;
	}) as typeof fetch;

	await expect(
		verifyScheduledArchiveBoundary(verifyOptions(releaseAt, () => currentTime, fetchImpl)),
	).rejects.toThrow(/response completed at or after the scheduled release/);

	expect(attempts).toBe(1);
	expect(currentTime).toBe(releaseAt);
});

test("stops after bounded timeout retries with a clear failure", async () => {
	currentTime = 5_000;
	const releaseAt = 30_000;
	let attempts = 0;
	const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
		attempts += 1;
		currentTime += requestTimeout(init);
		throw timeoutError();
	}) as typeof fetch;

	await expect(
		verifyScheduledArchiveBoundary(verifyOptions(releaseAt, () => currentTime, fetchImpl)),
	).rejects.toThrow(/timed out after 4 attempts/);

	expect(attempts).toBe(PRE_RELEASE_MAX_ATTEMPTS);
	expect(currentTime).toBeLessThan(releaseAt);
});

test("retries a timed out initial archive read, then proves the same URL is hidden and cached", async () => {
	currentTime = 0;
	const releaseAt = 120_000;
	const requestUrls: string[] = [];
	let attempts = 0;
	const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
		requestUrls.push(String(input));
		attempts += 1;
		if (attempts === 1) {
			currentTime += requestTimeout(init);
			throw timeoutError();
		}
		return attempts === 2
			? archiveResponse("MISS", "<html>archive, future link absent</html>")
			: archiveResponse("HIT", "<html>archive, future link absent</html>");
	}) as typeof fetch;

	await verifyScheduledArchiveWarm(verifyOptions(releaseAt, () => currentTime, fetchImpl));

	expect(attempts).toBe(3);
	expect(new Set(requestUrls)).toEqual(new Set(["https://preview.example/watch?probe=one"]));
	expect(currentTime).toBe(PRE_RELEASE_REQUEST_TIMEOUT_MS + 250);
	expect(currentTime).toBeLessThan(releaseAt);
});

test("retries when an initial archive body read is aborted by its timeout signal", async () => {
	currentTime = 0;
	const releaseAt = 120_000;
	const controllers: AbortController[] = [];
	let attempts = 0;
	const fetchImpl = (async (_input: RequestInfo | URL) => {
		attempts += 1;
		if (attempts === 1) {
			const response = archiveResponse("MISS", "");
			response.text = async () => {
				controllers.at(-1)?.abort();
				throw new DOMException("body timed out", "AbortError");
			};
			return response;
		}
		return attempts === 2
			? archiveResponse("MISS", "<html>archive, future link absent</html>")
			: archiveResponse("HIT", "<html>archive, future link absent</html>");
	}) as typeof fetch;
	const options = verifyOptions(releaseAt, () => currentTime, fetchImpl);
	options.timeoutSignal = milliseconds => {
		const controller = new AbortController();
		controllers.push(controller);
		return Object.assign(controller.signal, { timeoutMs: milliseconds });
	};

	await verifyScheduledArchiveWarm(options);

	expect(attempts).toBe(3);
	expect(currentTime).toBe(250);
	expect(currentTime).toBeLessThan(releaseAt);
});

test("fails before any archive request when the fixture lacks enough time for retries and the boundary probe", async () => {
	currentTime = 0;
	let attempts = 0;
	const fetchImpl = (async () => {
		attempts += 1;
		return archiveResponse("MISS", "<html>archive</html>");
	}) as typeof fetch;

	await expect(
		verifyScheduledArchiveWarm(
			verifyOptions(INITIAL_ARCHIVE_WARM_MIN_RUNWAY_MS - 1, () => currentTime, fetchImpl),
		),
	).rejects.toThrow(/needs at least/);

	expect(attempts).toBe(0);
});

test("minimum runway lets a delayed initial cache entry expire before the T-25 boundary probe", async () => {
	currentTime = 0;
	const releaseAt = INITIAL_ARCHIVE_WARM_MIN_RUNWAY_MS;
	const boundaryProbeAt = releaseAt - PRE_RELEASE_PROBE_WINDOW_MS;
	const archiveUrl = new URL("https://preview.example/watch?probe=one");
	const requestUrls: string[] = [];
	let initialRequests = 0;
	let boundaryRequests = 0;
	let initialCacheExpiresAt = 0;
	const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
		requestUrls.push(String(input));
		if (currentTime < boundaryProbeAt) {
			initialRequests += 1;
			if ([1, 2, 3, 5, 6, 7].includes(initialRequests)) {
				currentTime += requestTimeout(init);
				throw timeoutError();
			}
			currentTime += requestTimeout(init) - 1;
			if (initialRequests === 4) {
				initialCacheExpiresAt = currentTime + 30_000;
				return archiveResponse("MISS", "<html>archive, future link absent</html>");
			}
			return archiveResponse(
				currentTime < initialCacheExpiresAt ? "HIT" : "MISS",
				"<html>archive, future link absent</html>",
			);
		}

		boundaryRequests += 1;
		if (boundaryRequests === 1) {
			expect(currentTime).toBe(boundaryProbeAt);
			expect(currentTime).toBeGreaterThanOrEqual(initialCacheExpiresAt);
			return archiveResponse("MISS", "<html>archive, future link absent</html>", 25);
		}
		return archiveResponse("HIT", "<html>archive, future link absent</html>", 25);
	}) as typeof fetch;
	const options = verifyOptions(releaseAt, () => currentTime, fetchImpl);
	options.archiveUrl = archiveUrl;

	await verifyScheduledArchiveWarm(options);
	const result = await verifyScheduledArchiveBoundary(options);

	expect(initialRequests).toBe(8);
	expect(boundaryRequests).toBe(2);
	expect(new Set(requestUrls)).toEqual(new Set([String(archiveUrl)]));
	expect(initialCacheExpiresAt).toBeLessThan(boundaryProbeAt);
	expect(result.secondsUntilRelease).toBe(25);
	expect(result.boundaryAges).toEqual([25]);
	expect(currentTime).toBeLessThan(releaseAt);
});

test("does not retry non-timeout initial archive failures", async () => {
	currentTime = 0;
	const releaseAt = 120_000;
	let attempts = 0;
	const fetchImpl = (async () => {
		attempts += 1;
		throw new TypeError("network request failed");
	}) as typeof fetch;

	await expect(
		verifyScheduledArchiveWarm(
			verifyOptions(releaseAt, () => currentTime, fetchImpl),
		),
	).rejects.toThrow("network request failed");

	expect(attempts).toBe(1);
});
