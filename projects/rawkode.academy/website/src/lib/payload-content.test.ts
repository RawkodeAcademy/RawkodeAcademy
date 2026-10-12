import { describe, expect, it } from "vitest";
import { getAllCollection, runWithPayloadRequest, type PayloadRequestState } from "./payload-content";

const jsonResponse = (value: unknown, status = 200) =>
	new Response(JSON.stringify(value), {
		status,
		headers: { "content-type": "application/json" },
	});

describe("Payload video collection reads", () => {
	it("loads the full archive in ordered concurrent batches and records every release boundary", async () => {
		const startedPages: number[] = [];
		let activePages = 0;
		let maxActivePages = 0;
		const boundaryByPage = [
			"",
			"2099-01-04T00:00:00.000Z",
			"2099-01-03T00:00:00.000Z",
			"2099-01-02T00:00:00.000Z",
			"2099-01-01T00:00:00.000Z",
		];
		const state: PayloadRequestState = {
			env: {
				PAYLOAD_PREVIEW_PR: "payload-content-test-1",
				PAYLOAD_CONTENT: {
					async fetch(input: RequestInfo | URL) {
						const url = new URL(input instanceof Request ? input.url : String(input));
						const page = Number(url.searchParams.get("page"));
						startedPages.push(page);
						activePages += 1;
						maxActivePages = Math.max(maxActivePages, activePages);
						await new Promise((resolve) => setTimeout(resolve, Math.max(1, 20 - page * 3)));
						activePages -= 1;

						const count = page < 4 ? 100 : page === 4 ? 29 : 0;
						const docs = Array.from({ length: count }, (_, index) => ({
							id: `video-${page}-${index}`,
							slug: `video-${page}-${index}`,
							title: "Video",
							publishedAt: "2026-01-01T00:00:00.000Z",
						}));
						return jsonResponse({
							docs,
							page,
							limit: 100,
							hasNextPage: page < 4,
							nextReleaseAt: boundaryByPage[page] ?? null,
						});
					},
				},
			},
		};

		const videos = await runWithPayloadRequest(state, () => getAllCollection("videos"));

		expect(videos).toHaveLength(329);
		expect(videos.map((video) => video.slug)).toEqual([
			...Array.from({ length: 100 }, (_, index) => `video-1-${index}`),
			...Array.from({ length: 100 }, (_, index) => `video-2-${index}`),
			...Array.from({ length: 100 }, (_, index) => `video-3-${index}`),
			...Array.from({ length: 29 }, (_, index) => `video-4-${index}`),
		]);
		expect(startedPages).toHaveLength(4);
		expect(startedPages).toContain(1);
		expect(startedPages.slice(1).sort((a, b) => a - b)).toEqual([2, 3, 4]);
		expect(maxActivePages).toBe(3);
		expect(state.nextReleaseAt).toBe(Date.parse("2099-01-01T00:00:00.000Z"));
	});

	it("fails the complete collection read when a required concurrent page fails", async () => {
		const state = {
			env: {
				PAYLOAD_PREVIEW_PR: "payload-content-test-2",
				PAYLOAD_CONTENT: {
					async fetch(input: RequestInfo | URL) {
						const url = new URL(input instanceof Request ? input.url : String(input));
						const page = Number(url.searchParams.get("page"));
						if (page === 3) return jsonResponse({ error: "Unavailable" }, 503);
						return jsonResponse({
							docs: Array.from({ length: page === 1 ? 100 : 0 }, (_, index) => ({
								id: `video-${page}-${index}`,
								slug: `video-${page}-${index}`,
								title: "Video",
								publishedAt: "2026-01-01T00:00:00.000Z",
							})),
							page,
							limit: 100,
							hasNextPage: page < 4,
							nextReleaseAt: null,
						});
					},
				},
			},
		};

		await expect(
			runWithPayloadRequest(state, () => getAllCollection("videos")),
		).rejects.toThrow("Payload content request failed (503).");
	});
});
