// @vitest-environment node
import { expect, test } from "vitest";
import {
	PRE_RELEASE_MAX_ATTEMPTS,
	PRE_RELEASE_REQUEST_TIMEOUT_MS,
	PRE_RELEASE_SAFETY_MARGIN_MS,
	verifyScheduledArchiveBoundary,
} from "../deploy/scheduled-archive-boundary.mjs";

function timeoutError() {
	const error = new Error("request timed out");
	error.name = "TimeoutError";
	return error;
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
		timeoutSignal: (milliseconds: number) => ({ timeoutMs: milliseconds }) as AbortSignal,
		responseCacheAges: (response: Response) => [Number(response.headers.get("x-test-ttl"))],
	};
}

let currentTime = 0;

test("retries a timed out warm before release, then proves the same URL is a hidden-content cache HIT", async () => {
	currentTime = 0;
	const releaseAt = 30_000;
	const requestUrls: string[] = [];
	const timeoutBounds: Array<{ timeout: number; available: number }> = [];
	let attempts = 0;
	const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
		requestUrls.push(String(input));
		attempts += 1;
		const timeoutMs = (init?.signal as AbortSignal & { timeoutMs: number }).timeoutMs;
		timeoutBounds.push({
			timeout: timeoutMs,
			available: releaseAt - currentTime - PRE_RELEASE_SAFETY_MARGIN_MS,
		});
		if (attempts === 1) {
			currentTime += timeoutMs;
			throw timeoutError();
		}
		return attempts === 2
			? archiveResponse("MISS", "<html>archive, future link absent</html>", 15)
			: archiveResponse("HIT", "<html>archive, future link absent</html>", 15);
	}) as typeof fetch;

	const result = await verifyScheduledArchiveBoundary(verifyOptions(releaseAt, () => currentTime, fetchImpl));

	expect(attempts).toBe(3);
	expect(new Set(requestUrls)).toEqual(new Set(["https://preview.example/watch?probe=one"]));
	expect(timeoutBounds[0]?.timeout).toBe(PRE_RELEASE_REQUEST_TIMEOUT_MS);
	expect(timeoutBounds.every(({ timeout, available }) => timeout <= available)).toBe(true);
	expect(result.secondsUntilRelease).toBe(19);
	expect(result.boundaryAges).toEqual([15]);
	expect(currentTime).toBeLessThan(releaseAt);
});

test("caps a near-boundary timeout and fails before the release instead of crossing it", async () => {
	currentTime = 28_000;
	const releaseAt = 30_000;
	let attempts = 0;
	let timeoutMs = 0;
	const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
		attempts += 1;
		timeoutMs = (init?.signal as AbortSignal & { timeoutMs: number }).timeoutMs;
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
		currentTime += (init?.signal as AbortSignal & { timeoutMs: number }).timeoutMs;
		throw timeoutError();
	}) as typeof fetch;

	await expect(
		verifyScheduledArchiveBoundary(verifyOptions(releaseAt, () => currentTime, fetchImpl)),
	).rejects.toThrow(/timed out after 4 attempts/);

	expect(attempts).toBe(PRE_RELEASE_MAX_ATTEMPTS);
	expect(currentTime).toBeLessThan(releaseAt);
});
