// Turns published Payload catalogue records back into the Markdown/MDX files the
// Astro glob loaders already read. This is the inverse of the Payload static
// importer (projects/rawkode.academy/payload/src/static-content.ts): the site
// keeps building from files, so moving the source of truth to Payload changes
// nothing about rendering or runtime performance.
import { isDeepStrictEqual } from "node:util";
import { stringify } from "yaml";

export type PayloadDoc = Record<string, unknown> & {
	id: number | string;
	legacyId: string;
	slug?: string | null;
};

// Collections the website reads from Payload once the export is enabled.
export const ownedCollections = [
	"videos",
	"shows",
	"people",
	"technologies",
] as const;
export type OwnedCollection = (typeof ownedCollections)[number];

// Child records that are folded back into their parent's frontmatter.
export const supportingCollections = [
	"chapters",
	"learning-resources",
] as const;

export type DocIndex = Map<string, Map<string, PayloadDoc>>;

export type MaterialisedFile = {
	collection: OwnedCollection;
	legacyId: string;
	path: string;
	contents: string;
	verbatim: boolean;
};

// Keys the importer copies from frontmatter into structured Payload fields,
// kept in step with directKeys in the importer. streamUrl and thumbnailUrl are
// left out: the importer derives them for videos, so they are not frontmatter.
const directKeys = [
	"title",
	"name",
	"description",
	"subtitle",
	"tagline",
	"forename",
	"surname",
	"github",
	"twitter",
	"bluesky",
	"mastodon",
	"linkedin",
	"website",
	"youtube",
	"githubHandle",
	"githubUrl",
	"avatarUrl",
	"biography",
	"quote",
	"category",
	"subcategory",
	"documentation",
	"icon",
	"logo",
	"source",
	"license",
	"status",
	"terms",
	"aliases",
	"features",
	"relatedTechnologies",
	"useCases",
	"publishedAt",
	"date",
	"adoptedAt",
	"duration",
	"audioFileSize",
	"type",
	"howto",
	"youtubeId",
	"mediaReference",
	"realtimeKit",
	"podcast",
	"subscribeLinks",
	"gameFormatUrl",
	"code",
	"order",
	"section",
	"difficulty",
	"estimatedDuration",
	"prerequisites",
	"learningPath",
	"pullRequest",
	"publish",
	"draft",
	"links",
	"cncf",
	"community",
	"matrix",
	"seo",
	"logos",
	"whatYouWillLearn",
] as const;

const rowKeys = new Set([
	"terms",
	"whatYouWillLearn",
	"aliases",
	"features",
	"relatedTechnologies",
	"useCases",
	"prerequisites",
	"learningPath",
]);

// Payload arrays carry a generated row id that never existed in the source.
function stripRowIds(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(stripRowIds);
	if (value && typeof value === "object") {
		const { id: _id, ...rest } = value as Record<string, unknown>;
		return Object.fromEntries(
			Object.entries(rest).map(([key, child]) => [key, stripRowIds(child)]),
		);
	}
	return value;
}

function fromRows(value: unknown): unknown {
	if (!Array.isArray(value)) return value;
	return value.map((row) =>
		row && typeof row === "object" ? (row as { value?: unknown }).value : row,
	);
}

function isEmpty(value: unknown): boolean {
	return (
		value === null ||
		value === undefined ||
		value === "" ||
		(Array.isArray(value) && value.length === 0)
	);
}

// Same rule the importer uses to turn a frontmatter reference into a legacy ID.
export function cleanReference(value: unknown): string | null {
	if (typeof value === "string") {
		const cleaned = value.replace(/^\.\//, "").replace(/\/index$/, "");
		return (
			cleaned.replace(/^(?:people|technologies|videos|shows|series)\//, "") ||
			null
		);
	}
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		return cleanReference(record.id ?? record.slug ?? record.value);
	}
	return null;
}

function relationId(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "object")
		return relationId((value as { id?: unknown }).id);
	return String(value);
}

function lookup(
	index: DocIndex,
	collection: string,
	value: unknown,
): PayloadDoc | null {
	const id = relationId(value);
	if (id === null) return null;
	return index.get(collection)?.get(id) ?? null;
}

function legacyIds(
	index: DocIndex,
	collection: string,
	value: unknown,
	owner: string,
): string[] {
	const values = Array.isArray(value) ? value : isEmpty(value) ? [] : [value];
	return values.map((item) => {
		const doc = lookup(index, collection, item);
		if (!doc)
			throw new Error(
				`${owner} references ${collection} ${relationId(item)}, which is not published`,
			);
		return doc.legacyId;
	});
}

// Writes `next` into the frontmatter unless the source already holds an
// equivalent value, so untouched fields keep their original formatting.
function assign(
	frontmatter: Record<string, unknown>,
	base: Record<string, unknown>,
	key: string,
	next: unknown,
	equivalent: (previous: unknown) => boolean = (previous) =>
		isDeepStrictEqual(previous, next),
): void {
	const hadKey = Object.hasOwn(base, key);
	if (isEmpty(next)) {
		if (hadKey && !isEmpty(base[key])) delete frontmatter[key];
		return;
	}
	if (hadKey && equivalent(base[key])) return;
	frontmatter[key] = next;
}

function sameReferences(previous: unknown, next: string[]): boolean {
	const values = Array.isArray(previous)
		? previous
		: isEmpty(previous)
			? []
			: [previous];
	return isDeepStrictEqual(values.map(cleanReference), next);
}

function chapterFrontmatter(index: DocIndex, doc: PayloadDoc): unknown[] {
	const ids = Array.isArray(doc.chapters) ? doc.chapters : [];
	return ids.map((value) => {
		const chapter = lookup(index, "chapters", value);
		if (!chapter)
			throw new Error(
				`videos ${doc.legacyId} references chapter ${relationId(value)}, which is not published`,
			);
		return { startTime: chapter.startTime, title: chapter.title };
	});
}

function learningResourcesFrontmatter(
	index: DocIndex,
	doc: PayloadDoc,
	base: Record<string, unknown>,
): Record<string, string[]> | null {
	const resources = lookup(index, "learning-resources", doc.learningResources);
	if (!resources) return null;
	const previous = (base.learningResources ?? {}) as Record<string, unknown>;
	const result: Record<string, string[]> = {};
	for (const key of ["official", "community", "tutorials"]) {
		const urls = (
			Array.isArray(resources[key]) ? (resources[key] as unknown[]) : []
		).map((row) => String((row as { url?: unknown }).url ?? row));
		if (urls.length || Object.hasOwn(previous, key)) result[key] = urls;
	}
	return result;
}

function sourceBase(doc: PayloadDoc): Record<string, unknown> {
	const base = doc.sourceData ?? doc.editorialData;
	return base && typeof base === "object" && !Array.isArray(base)
		? structuredClone(base as Record<string, unknown>)
		: {};
}

function year(value: unknown): string {
	const parsed = new Date(String(value ?? ""));
	return Number.isNaN(parsed.getTime())
		? "undated"
		: String(parsed.getUTCFullYear());
}

// Where an editor-created record lands. Imported records keep sourcePath.
function pathFor(
	collection: OwnedCollection,
	doc: PayloadDoc,
	frontmatter: Record<string, unknown>,
): string {
	if (typeof doc.sourcePath === "string" && doc.sourcePath)
		return doc.sourcePath;
	const name = doc.slug || doc.legacyId;
	switch (collection) {
		case "videos": {
			const show = cleanReference(frontmatter.show);
			const folder = show ? `shows/${show}` : "standalone";
			return `videos/${folder}/${year(frontmatter.publishedAt)}/${name}.md`;
		}
		case "shows":
			return `shows/${doc.legacyId}.md`;
		case "people":
			return `people/${doc.legacyId}.mdx`;
		case "technologies":
			return `technologies/${doc.legacyId}/index.mdx`;
	}
}

export function frontmatterFor(
	collection: OwnedCollection,
	doc: PayloadDoc,
	index: DocIndex,
): Record<string, unknown> {
	const base = sourceBase(doc);
	const frontmatter = structuredClone(base);
	const owner = `${collection} ${doc.legacyId}`;

	for (const key of directKeys) {
		if (!Object.hasOwn(doc, key)) continue;
		const raw = stripRowIds(doc[key]);
		const value = rowKeys.has(key) ? fromRows(raw) : raw;
		assign(frontmatter, base, key, value, (previous) =>
			isDeepStrictEqual(stripRowIds(previous), value),
		);
	}
	assign(frontmatter, base, "cover", doc.cover);
	assign(frontmatter, base, "resources", stripRowIds(doc.contentResources));

	// Identity: the website schemas key videos, shows and people on `id`.
	if (collection !== "technologies") frontmatter.id = doc.legacyId;
	if (doc.slug && (Object.hasOwn(base, "slug") || doc.slug !== doc.legacyId))
		frontmatter.slug = doc.slug;

	const references = (
		key: string,
		target: string,
		value: unknown,
		many: boolean,
	) => {
		const ids = legacyIds(index, target, value, owner);
		const next = many ? ids : (ids[0] ?? null);
		assign(frontmatter, base, key, next, (previous) =>
			sameReferences(previous, ids),
		);
	};

	if (collection === "videos") {
		references("technologies", "technologies", doc.technologies, true);
		references("guests", "people", doc.guests, true);
		references("show", "shows", doc.show, false);
		assign(frontmatter, base, "chapters", chapterFrontmatter(index, doc));
	}
	if (collection === "shows") references("hosts", "people", doc.hosts, true);
	if (collection === "technologies") {
		const resources = learningResourcesFrontmatter(index, doc, base);
		if (resources) assign(frontmatter, base, "learningResources", resources);
	}
	return frontmatter;
}

export function serialise(
	frontmatter: Record<string, unknown>,
	body: string,
): string {
	// Astro parses frontmatter as YAML 1.1, where unquoted "2022-06-17" is a
	// date and "on" is a boolean; emitting 1.1 quotes those strings.
	const yaml = stringify(frontmatter, {
		version: "1.1",
		lineWidth: 0,
	}).trimEnd();
	const content = body.startsWith("\n") ? body : `\n${body}`;
	return `---\n${yaml}\n---${content}`;
}

export function materialise(
	collection: OwnedCollection,
	doc: PayloadDoc,
	index: DocIndex,
): MaterialisedFile {
	// Records imported from git and never edited since carry the original file.
	if (doc.locallyEdited === false && typeof doc.sourceRaw === "string") {
		return {
			collection,
			legacyId: doc.legacyId,
			path: pathFor(collection, doc, {}),
			contents: doc.sourceRaw,
			verbatim: true,
		};
	}
	const frontmatter = frontmatterFor(collection, doc, index);
	const body = typeof doc.body === "string" ? doc.body : "";
	return {
		collection,
		legacyId: doc.legacyId,
		path: pathFor(collection, doc, frontmatter),
		contents: serialise(frontmatter, body),
		verbatim: false,
	};
}
