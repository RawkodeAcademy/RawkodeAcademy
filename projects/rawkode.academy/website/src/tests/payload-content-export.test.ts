// Round-trip check for the Payload content export: the real importer turns the
// checked-in content into catalogue records, those records are shaped the way
// Payload's REST API returns them, and the export must give back the same
// content tree the website builds from today.
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import matter from "gray-matter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	type DocsByCollection,
	exportContent,
	gitLegacyId,
} from "../../scripts/payload-content/export";
import {
	cleanReference,
	ownedCollections,
	type PayloadDoc,
} from "../../scripts/payload-content/mapping";
import {
	editedEverywhere,
	simulatePayload,
} from "../../scripts/payload-content/simulate";

const gitRoot = path.resolve(import.meta.dirname, "../../../../../content");

const referenceFields = ["technologies", "guests", "show", "hosts"];

// Compare the way the website's schemas read frontmatter.
function comparable(contents: string): { data: unknown; body: string } {
	const { data, content } = matter(contents);
	const normalised = JSON.parse(JSON.stringify(data)) as Record<
		string,
		unknown
	>;
	for (const field of referenceFields) {
		const value = normalised[field];
		if (Array.isArray(value)) normalised[field] = value.map(cleanReference);
		else if (value !== undefined) normalised[field] = cleanReference(value);
	}
	return { data: normalised, body: content.replace(/^\n/, "") };
}

let docs: DocsByCollection;
const outputs: string[] = [];

async function exportTo(input: DocsByCollection) {
	const outRoot = await mkdtemp(path.join(tmpdir(), "payload-export-"));
	outputs.push(outRoot);
	const report = await exportContent({
		docs: input,
		gitRoot,
		outRoot,
		source: "test",
	});
	return { outRoot, report };
}

function entryFor(collection: string, legacyId: string): PayloadDoc {
	const doc = docs[collection]?.find((item) => item.legacyId === legacyId);
	if (!doc) throw new Error(`No ${collection} ${legacyId}`);
	return doc;
}

beforeAll(async () => {
	docs = await simulatePayload(gitRoot);
}, 120_000);

afterAll(async () => {
	await Promise.all(
		outputs.map((dir) => rm(dir, { recursive: true, force: true })),
	);
});

describe("Payload content export", () => {
	it("reproduces unedited content byte for byte", async () => {
		const { outRoot, report } = await exportTo(docs);
		expect(report.missingFromPayload).toEqual([]);
		expect(report.newInPayload).toEqual([]);
		expect(report.regenerated).toBe(0);
		for (const collection of ownedCollections) {
			for (const doc of docs[collection] ?? []) {
				const relative = String(doc.sourcePath);
				const [exported, original] = await Promise.all([
					readFile(path.join(outRoot, relative), "utf8"),
					readFile(path.join(gitRoot, relative), "utf8"),
				]);
				expect(exported, relative).toBe(original);
			}
		}
	}, 120_000);

	it("regenerates every entry with the same meaning when edited in Payload", async () => {
		const { outRoot, report } = await exportTo(editedEverywhere(docs));
		expect(report.verbatim).toBe(0);
		for (const collection of ownedCollections) {
			for (const doc of docs[collection] ?? []) {
				const relative = String(doc.sourcePath);
				const [exported, original] = await Promise.all([
					readFile(path.join(outRoot, relative), "utf8"),
					readFile(path.join(gitRoot, relative), "utf8"),
				]);
				expect(comparable(exported), relative).toEqual(comparable(original));
			}
		}
	}, 120_000);

	it("carries editorial changes into the frontmatter", async () => {
		const video = entryFor(
			"videos",
			gitLegacyId(
				gitRoot,
				path.join(
					gitRoot,
					"videos/shows/rawkode-live/2023/hands-on-introduction-to-dapr.md",
				),
			),
		);
		const guest = entryFor("people", "salaboy");
		const edited = editedEverywhere(docs);
		edited.videos = (edited.videos ?? []).map((doc) =>
			doc.id === video.id
				? {
						...doc,
						title: "Dapr, hands on",
						guests: [guest.id],
						tagline: "",
					}
				: doc,
		);
		const { outRoot } = await exportTo(edited);
		const { data } = matter(
			await readFile(path.join(outRoot, String(video.sourcePath)), "utf8"),
		);
		expect(data.title).toBe("Dapr, hands on");
		expect(data.guests).toEqual(["salaboy"]);
		expect(data.id).toBe(video.legacyId);
		expect(data).not.toHaveProperty("tagline");
	}, 120_000);

	it("writes a CMS-created episode where the website expects it", async () => {
		const show = entryFor("shows", "rawkode-live");
		const technology = entryFor("technologies", "kubernetes");
		const created: PayloadDoc = {
			id: 9_999_999,
			legacyId: "a1b2c3d4e5f6g7h8i9j0k1l2",
			slug: "scheduled-from-the-cms",
			title: "Scheduled from the CMS",
			description: "A livestream scheduled in Payload rather than in git.",
			publishedAt: "2026-11-05T17:00:00.000Z",
			type: "live",
			show: show.id,
			technologies: [technology.id],
			guests: [],
			chapters: [],
			whatYouWillLearn: [],
			body: "",
			locallyEdited: true,
			sourcePath: null,
			sourceData: null,
			sourceRaw: null,
		};
		const { outRoot, report } = await exportTo({
			...docs,
			videos: [...(docs.videos ?? []), created],
		});
		expect(report.newInPayload).toEqual([`videos/${created.legacyId}`]);
		const { data } = matter(
			await readFile(
				path.join(
					outRoot,
					"videos/shows/rawkode-live/2026/scheduled-from-the-cms.md",
				),
				"utf8",
			),
		);
		expect(data).toMatchObject({
			id: created.legacyId,
			slug: "scheduled-from-the-cms",
			show: "rawkode-live",
			technologies: ["kubernetes"],
			type: "live",
		});
	}, 120_000);

	it("refuses to publish a reference to an unpublished record", async () => {
		const withoutGuest = {
			...docs,
			people: (docs.people ?? []).filter((doc) => doc.legacyId !== "salaboy"),
		};
		await expect(exportTo(editedEverywhere(withoutGuest))).rejects.toThrow(
			/references people .* not published/,
		);
	}, 120_000);
});
