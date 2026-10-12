import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getAllCollection,
	getPayloadCollectionPage,
	listPayloadContent,
} from "@/lib/payload-content";

import { getHomepageContent, getLatestContent } from "@/lib/content";

vi.mock("@/lib/payload-content", () => ({
	getAllCollection: vi.fn(),
	getPayloadCollectionPage: vi.fn(),
	listPayloadContent: vi.fn(),
}));
const mockedGetCollection = vi.mocked(listPayloadContent);
const mockedGetPage = vi.mocked(getPayloadCollectionPage);

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
		mockedGetPage.mockReset();
		vi.mocked(getAllCollection).mockReset();
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
					draft: false,
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

		const latest = await getLatestContent(10);

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

	it("reads one released window per homepage collection and reuses exact totals", async () => {
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
		const totals = {
			videos: 329,
			articles: 40,
			news: 5,
			courses: 6,
			learningPaths: 7,
		};
		mockedGetPage.mockImplementation(async (collection, options) => ({
			docs: (collections[collection as keyof typeof collections] ?? []) as never,
			page: options?.page ?? 1,
			limit: options?.limit ?? 12,
			totalDocs: totals[collection as keyof typeof totals],
			hasNextPage: false,
			nextReleaseAt: null,
		}) as never);

		const homepage = await getHomepageContent(12);

		expect(mockedGetPage).toHaveBeenCalledTimes(5);
		for (const collection of ["videos", "articles", "news", "courses", "learningPaths"] as const) {
			expect(mockedGetPage).toHaveBeenCalledWith(collection, {
				limit: 12,
				releasedOnly: true,
			});
		}
		expect(homepage.counts).toEqual(totals);
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
