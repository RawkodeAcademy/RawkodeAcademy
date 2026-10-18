import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { graphql } from "graphql";
import { toSql, videosSeed } from "../../../../../content/scripts/platform-seed";
import { getSchema } from "../read-model/schema";
import { exec, migratedD1, seed } from "./d1";

// Pinned clock: Swamp Club (2026-10-22T16:00Z) is upcoming.
const now = new Date("2026-10-18T12:00:00.000Z");
let db: Awaited<ReturnType<typeof migratedD1>>;
const query = async (source: string) => {
	const result = await graphql({ schema: getSchema({ DB: db.DB }, () => now), source, contextValue: {} });
	if (result.errors) throw result.errors[0];
	return result.data as Record<string, any>;
};

beforeAll(async () => {
	db = await migratedD1(join(import.meta.dir, ".."));
	const imported = await videosSeed();
	expect(imported.warnings).toEqual([]);
	await seed(db.DB, toSql(imported));
});
afterAll(() => db.dispose());

describe("videos read model", () => {
	it("imports every video, upcoming streams included", async () => {
		const { getAllVideos } = await query("{ getAllVideos { id } }");
		expect(getAllVideos).toHaveLength(330);
	});

	it("serves a video the way the website subgraph did", async () => {
		const { videoByID } = await query(`{ videoByID(id: "jmjdponjje5ueukwqlprmcbq") {
			id slug title description publishedAt duration type category streamUrl thumbnailUrl whatYouWillLearn } }`);
		expect(videoByID).toMatchObject({
			id: "jmjdponjje5ueukwqlprmcbq",
			slug: "hands-on-introduction-to-dapr",
			title: "Hands-on Introduction to Dapr",
			publishedAt: "2023-12-14",
			duration: 4632,
			type: "live",
			category: "tutorial",
			streamUrl: "https://content.rawkode.academy/videos/jmjdponjje5ueukwqlprmcbq/stream.m3u8",
			thumbnailUrl: "https://content.rawkode.academy/videos/jmjdponjje5ueukwqlprmcbq/thumbnail.webp",
		});
		expect(videoByID.whatYouWillLearn).toHaveLength(3);
		const { videoBySlug } = await query(`{ videoBySlug(slug: "hands-on-introduction-to-dapr") { id } }`);
		expect(videoBySlug.id).toBe("jmjdponjje5ueukwqlprmcbq");
	});

	it("separates upcoming streams from published videos", async () => {
		const { getUpcomingVideos, getLatestVideos } = await query("{ getUpcomingVideos { slug publishedAt } getLatestVideos(limit: 400) { slug publishedAt } }");
		expect(getUpcomingVideos.map((v: { slug: string }) => v.slug)).toContain("hands-on-introduction-to-swamp-club");
		expect(getLatestVideos.map((v: { slug: string }) => v.slug)).not.toContain("hands-on-introduction-to-swamp-club");
		expect(getUpcomingVideos.length + getLatestVideos.length).toBe(330);
		const dates = getLatestVideos.map((v: { publishedAt: string }) => v.publishedAt);
		expect(dates).toEqual([...dates].sort().reverse());
	});

	it("searches published titles, descriptions and subtitles case-insensitively", async () => {
		const { simpleSearch } = await query(`{ simpleSearch(term: "DAPR") { slug } }`);
		expect(simpleSearch.map((v: { slug: string }) => v.slug)).toContain("hands-on-introduction-to-dapr");
		const { swamp } = await query(`{ swamp: simpleSearch(term: "Swamp Club") { slug } }`);
		expect(swamp).toEqual([]);
		const { wildcard } = await query(`{ wildcard: simpleSearch(term: "%") { slug } }`);
		expect(wildcard).toEqual([]);
	});

	it("returns random published videos", async () => {
		const { getRandomVideos } = await query("{ getRandomVideos(limit: 5) { slug } }");
		expect(getRandomVideos).toHaveLength(5);
		expect(getRandomVideos.map((v: { slug: string }) => v.slug)).not.toContain("hands-on-introduction-to-swamp-club");
	});

	it("resolves Video entities for the gateway", async () => {
		const { _entities } = await query(`{ _entities(representations: [{ __typename: "Video", id: "jmjdponjje5ueukwqlprmcbq" }]) { ... on Video { slug } } }`);
		expect(_entities).toEqual([{ slug: "hands-on-introduction-to-dapr" }]);
	});
});

describe("videos migrations", () => {
	it("upgrade a database created by the original service, keeping its rows", async () => {
		const old = await migratedD1(join(import.meta.dir, ".."), "0000_medical_flatman.sql");
		await old.DB.prepare("INSERT INTO videos (id, title, subtitle, slug, description, duration, publishedAt) VALUES ('legacy', 'Legacy', 'Sub', 'legacy', 'An old description', 60, 1600000000)").run();
		await exec(old.DB, await readFile(join(import.meta.dir, "../data-model/migrations/0001_content_fields.sql"), "utf8"));
		expect(await old.DB.prepare("SELECT title, subtitle, duration FROM videos WHERE id = 'legacy'").first()).toEqual({ title: "Legacy", subtitle: "Sub", duration: 60 });
		await seed(old.DB, toSql(await videosSeed()));
		expect((await old.DB.prepare("SELECT count(*) AS n FROM videos").first<{ n: number }>())?.n).toBe(330);
		await old.dispose();
	});
});
