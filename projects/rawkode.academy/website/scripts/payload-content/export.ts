// Materialises the Payload-owned content collections into a content tree the
// website builds from. Everything else (articles, courses, assets, …) is copied
// from the checked-in content package, so the tree is complete on its own.
//
//   bun scripts/payload-content/export.ts [--out dir] [--payload-url URL]
//     [--fixture docs.json] [--strict] [--if-enabled]
//
// The output defaults to ACADEMY_CONTENT_ROOT (or .content/payload), the tree
// @rawkodeacademy/content reads when ACADEMY_CONTENT_SOURCE=payload.
// --if-enabled makes the command a no-op unless ACADEMY_CONTENT_SOURCE=payload,
// so the build can always call it.

import { readFileSync } from "node:fs";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { payloadContentRoot } from "@rawkodeacademy/content/utils";
import matter from "gray-matter";
import {
	type DocIndex,
	type MaterialisedFile,
	materialise,
	type OwnedCollection,
	ownedCollections,
	type PayloadDoc,
	supportingCollections,
} from "./mapping";

export type DocsByCollection = Record<string, PayloadDoc[]>;

export type ExportReport = {
	source: string;
	written: number;
	verbatim: number;
	regenerated: number;
	// Present in git but not published in Payload: would vanish from the site.
	missingFromPayload: string[];
	// Published in Payload but not in git: new in the CMS.
	newInPayload: string[];
};

const contentDirectory: Record<OwnedCollection, string> = {
	videos: "videos",
	shows: "shows",
	people: "people",
	technologies: "technologies",
};

export async function fetchPublished(
	baseUrl: string,
	collections: readonly string[],
	fetcher: typeof fetch = fetch,
): Promise<DocsByCollection> {
	const result: DocsByCollection = {};
	for (const collection of collections) {
		// Anonymous reads only ever see published, non-tombstoned records.
		const url = new URL(`/api/${collection}`, baseUrl);
		url.searchParams.set("pagination", "false");
		url.searchParams.set("depth", "0");
		const response = await fetcher(url, {
			headers: { accept: "application/json" },
		});
		if (!response.ok)
			throw new Error(`GET ${url} failed with ${response.status}`);
		const body = (await response.json()) as { docs?: PayloadDoc[] };
		if (!Array.isArray(body.docs))
			throw new Error(`GET ${url} returned no docs array`);
		result[collection] = body.docs;
	}
	return result;
}

export function buildIndex(docs: DocsByCollection): DocIndex {
	const index: DocIndex = new Map();
	for (const [collection, list] of Object.entries(docs)) {
		index.set(collection, new Map(list.map((doc) => [String(doc.id), doc])));
	}
	return index;
}

async function walk(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true }).catch(
		() => [],
	);
	const files: string[] = [];
	for (const entry of entries) {
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(absolute)));
		else if (entry.isFile()) files.push(absolute);
	}
	return files;
}

const isEntry = (file: string) => /\.mdx?$/i.test(file);

// The importer's legacy ID rule: frontmatter id, else the path without /index.
export function gitLegacyId(contentRoot: string, file: string): string {
	const relative = path
		.relative(contentRoot, file)
		.split(path.sep)
		.join("/")
		.replace(/^[^/]+\//, "");
	const { data } = matter(readFileSync(file, "utf8"));
	if (typeof data.id === "string" && data.id.trim()) return data.id;
	const withoutExtension = relative.replace(/\.(?:md|mdx)$/i, "");
	return withoutExtension.endsWith("/index")
		? withoutExtension.slice(0, -"/index".length)
		: withoutExtension;
}

export async function exportContent(options: {
	docs: DocsByCollection;
	gitRoot: string;
	outRoot: string;
	source: string;
}): Promise<ExportReport> {
	const { docs, gitRoot, outRoot } = options;
	const index = buildIndex(docs);

	const files: MaterialisedFile[] = [];
	for (const collection of ownedCollections) {
		for (const doc of docs[collection] ?? [])
			files.push(materialise(collection, doc, index));
	}
	const seen = new Map<string, MaterialisedFile>();
	for (const file of files) {
		const clash = seen.get(file.path);
		if (clash)
			throw new Error(
				`${file.collection} ${file.legacyId} and ${clash.collection} ${clash.legacyId} both map to ${file.path}`,
			);
		seen.set(file.path, file);
	}

	const missingFromPayload: string[] = [];
	const newInPayload: string[] = [];
	for (const collection of ownedCollections) {
		const directory = path.join(gitRoot, contentDirectory[collection]);
		const gitIds = new Set(
			(await walk(directory))
				.filter(isEntry)
				.map((file) => gitLegacyId(gitRoot, file)),
		);
		const payloadIds = new Set(
			(docs[collection] ?? []).map((doc) => doc.legacyId),
		);
		for (const id of gitIds)
			if (!payloadIds.has(id)) missingFromPayload.push(`${collection}/${id}`);
		for (const id of payloadIds)
			if (!gitIds.has(id)) newInPayload.push(`${collection}/${id}`);
	}

	await rm(outRoot, { recursive: true, force: true });
	await mkdir(outRoot, { recursive: true });
	await cp(gitRoot, outRoot, {
		recursive: true,
		filter: (source) => !source.split(path.sep).includes("node_modules"),
	});
	// Payload is authoritative for the owned collections: drop their entries
	// (assets such as logos and covers stay) and write what Payload publishes.
	for (const collection of ownedCollections) {
		for (const file of await walk(
			path.join(outRoot, contentDirectory[collection]),
		))
			if (isEntry(file)) await rm(file);
	}
	for (const file of files) {
		const target = path.join(outRoot, file.path);
		if (!target.startsWith(`${outRoot}${path.sep}`))
			throw new Error(`Refusing to write outside the export: ${file.path}`);
		await mkdir(path.dirname(target), { recursive: true });
		await writeFile(target, file.contents);
	}

	const verbatim = files.filter((file) => file.verbatim).length;
	const report: ExportReport = {
		source: options.source,
		written: files.length,
		verbatim,
		regenerated: files.length - verbatim,
		missingFromPayload: missingFromPayload.sort(),
		newInPayload: newInPayload.sort(),
	};
	await writeFile(
		path.join(outRoot, ".payload-export.json"),
		`${JSON.stringify(report, null, "\t")}\n`,
	);
	return report;
}

async function main(): Promise<void> {
	const { values } = parseArgs({
		options: {
			out: { type: "string" },
			"payload-url": { type: "string" },
			"git-root": { type: "string" },
			fixture: { type: "string" },
			strict: { type: "boolean", default: false },
			"if-enabled": { type: "boolean", default: false },
		},
	});
	if (values["if-enabled"] && process.env.ACADEMY_CONTENT_SOURCE !== "payload")
		return;

	// Same root the content package reads when ACADEMY_CONTENT_SOURCE=payload.
	const outRoot = values.out ? path.resolve(values.out) : payloadContentRoot();
	const gitRoot = path.resolve(
		values["git-root"] ??
			path.join(import.meta.dirname, "../../../../../content"),
	);
	if (path.resolve(outRoot) === gitRoot)
		throw new Error("Refusing to export over the checked-in content");

	const payloadUrl =
		values["payload-url"] ??
		process.env.PAYLOAD_URL ??
		"https://admin.rawkode.academy";
	const collections = [...ownedCollections, ...supportingCollections];
	const docs = values.fixture
		? (JSON.parse(readFileSync(values.fixture, "utf8")) as DocsByCollection)
		: await fetchPublished(payloadUrl, collections);
	const source = values.fixture ? `fixture:${values.fixture}` : payloadUrl;

	const report = await exportContent({ docs, gitRoot, outRoot, source });
	console.log(
		`Exported ${report.written} entries from ${source} (${report.verbatim} verbatim, ${report.regenerated} edited in Payload)`,
	);
	if (report.newInPayload.length)
		console.log(`New in Payload: ${report.newInPayload.join(", ")}`);
	if (report.missingFromPayload.length) {
		const message = `${report.missingFromPayload.length} git entries are not published in Payload: ${report.missingFromPayload.slice(0, 20).join(", ")}${report.missingFromPayload.length > 20 ? ", …" : ""}`;
		if (values.strict) throw new Error(message);
		console.warn(message);
	}
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
