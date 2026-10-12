import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAllCollection, listPayloadContent } from "@/lib/payload-content";

import { getHomepageContent, getLatestContent } from "@/lib/content";

vi.mock("@/lib/payload-content", () => ({
	getAllCollection: vi.fn(),
	listPayloadContent: vi.fn(),
}));
const mockedGetCollection = vi.mocked(listPayloadContent);
const mockedGetAllCollection = vi.mocked(getAllCollection);

const entry = (id: string, data: Record<string, unknown>) => ({
	id,
	slug: String(data.slug ?? id),
	collection: "articles",
	body: "",
	mediaAssets: [],
	data,
});

describe("Academy latest content", () => {
	beforeEach(() => {
		mockedGetCollection.mockReset();
		mockedGetAllCollection.mockReset();
	});

	it("merges every public content format into one date-sorted feed", async () => {
		const collections = {
			videos: [
				entry("video-1", {
					id: "video-1",
					slug: "video-1",
					title: "Video",
					description: "Video description.",
					publishedAt: new Date("2026-01-03T00:00:00.000Z"),
					duration: 3600,
					type: "recorded",
				}),
			],
			articles: [
				entry("article-1", {
					title: "Article",
					description: "Article description.",
					publishedAt: new Date("2026-01-04T00:00:00.000Z"),
				}),
			],
			news: [
				entry("news-1", {
					title: "News",
					description: "News description.",
					publishedAt: new Date("2026-01-05T00:00:00.000Z"),
				}),
			],
			courses: [
				entry("course-1", {
					title: "Course",
					description: "Course description.",
					publishedAt: new Date("2026-01-02T00:00:00.000Z"),
				}),
			],
			learningPaths: [
				entry("path-1", {
					title: "Learning path",
					description: "Learning path description.",
					publishedAt: new Date("2026-01-01T00:00:00.000Z"),
				}),
			],
		};

		mockedGetCollection.mockImplementation(async (name) => {
			const values = collections[name as keyof typeof collections] ?? [];
			return values as never;
		});
		mockedGetAllCollection.mockImplementation(async (name) => {
			const values = collections[name as keyof typeof collections] ?? [];
			return values as never;
		});

		const latest = await getLatestContent(10, new Date("2026-01-06T00:00:00.000Z"));

		expect(latest.map((item) => item.kind)).toEqual([
			"News",
			"Article",
			"Video",
			"Course",
			"Learning path",
		]);
		expect(latest.map((item) => item.href)).toEqual([
			"/news/news-1",
			"/read/article-1",
			"/watch/video-1",
			"/courses/course-1",
			"/learning-paths/path-1",
		]);
	});

	it("reuses homepage collection reads for Latest, feature cards, and counts", async () => {
		const now = new Date("2026-01-06T00:00:00.000Z");
		const future = new Date("2026-01-07T00:00:00.000Z");
		const collections = {
			videos: [
				entry("video-1", {
					id: "video-1",
					slug: "video-1",
					title: "Video",
					description: "Video description.",
					publishedAt: new Date("2026-01-03T00:00:00.000Z"),
					duration: 3600,
					type: "recorded",
				}),
				entry("video-future", {
					id: "video-future",
					slug: "video-future",
					title: "Future video",
					description: "Not released yet.",
					publishedAt: future,
					duration: 3600,
					type: "recorded",
				}),
			],
			articles: [
				entry("article-1", {
					title: "Article",
					description: "Article description.",
					publishedAt: new Date("2026-01-04T00:00:00.000Z"),
				}),
				entry("article-future", {
					title: "Future article",
					description: "Not released yet.",
					publishedAt: future,
				}),
			],
			news: [
				entry("news-1", {
					title: "News",
					description: "News description.",
					publishedAt: new Date("2026-01-05T00:00:00.000Z"),
				}),
				entry("news-future", {
					title: "Future news",
					description: "Not released yet.",
					publishedAt: future,
				}),
			],
			courses: [
				entry("course-1", {
					title: "Course",
					description: "Course description.",
					publishedAt: new Date("2026-01-02T00:00:00.000Z"),
				}),
				entry("course-future", {
					title: "Future course",
					description: "Not released yet.",
					publishedAt: future,
				}),
			],
			learningPaths: [
				entry("path-1", {
					title: "Learning path",
					description: "Learning path description.",
					publishedAt: new Date("2026-01-01T00:00:00.000Z"),
				}),
				entry("path-future", {
					title: "Future learning path",
					description: "Not released yet.",
					publishedAt: future,
				}),
			],
		};

		mockedGetAllCollection.mockImplementation(async (collection) => {
			const values = collections[collection as keyof typeof collections] ?? [];
			return values as never;
		});
		mockedGetCollection.mockImplementation(async (collection) => {
			const values = collections[collection as keyof typeof collections] ?? [];
			return values as never;
		});

		const homepage = await getHomepageContent(12, now);

		expect(mockedGetAllCollection).toHaveBeenCalledTimes(1);
		expect(mockedGetAllCollection).toHaveBeenCalledWith("videos");
		expect(mockedGetCollection).toHaveBeenCalledTimes(4);
		for (const collection of ["articles", "news", "courses", "learningPaths"] as const) {
			expect(mockedGetCollection).toHaveBeenCalledWith(collection, { limit: 100 });
		}
		expect(homepage.counts).toEqual({
			videos: 1,
			articles: 1,
			news: 1,
			courses: 1,
			learningPaths: 1,
		});
		expect(homepage.videos.map((video) => video.slug)).toEqual(["video-1"]);
		expect(homepage.learningPaths.map((path) => path.slug)).toEqual(["path-1"]);
		expect(homepage.latest.map((item) => item.kind)).toEqual([
			"News",
			"Article",
			"Video",
			"Course",
			"Learning path",
		]);
	});
});
