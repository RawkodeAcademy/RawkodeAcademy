#!/usr/bin/env bun
// Builds one SQL seed per platform service from the checked-in content, so the
// D1-backed services can take over from git. Each seed replaces the table's
// rows wholesale: apply it with
//   wrangler d1 execute platform-<service> --remote --file <out>/<service>.sql
//
//   bun scripts/platform-seed.ts --out /tmp/platform-seed
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { parseArgs } from "node:util";
import matter from "gray-matter";
import { technologyZod } from "../src/technologies";

export const contentRoot = join(dirname(new URL(import.meta.url).pathname), "..");

type Row = Record<string, string | number | boolean | null | object>;
export type Seed = { table: string; rows: Row[]; warnings: string[] };

async function walk(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
	const files: string[] = [];
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(path)));
		else if (/\.mdx?$/.test(entry.name)) files.push(path);
	}
	return files;
}

async function read(path: string) {
	const { data, content } = matter(await readFile(path, "utf8"));
	return { data: data as Record<string, any>, body: content.trim() };
}

const stem = (path: string) => basename(path).replace(/\.mdx?$/, "");
const optional = <T>(value: T | undefined | null): T | null => value ?? null;
const list = (value: unknown): string[] | null =>
	Array.isArray(value) && value.length ? value.map(String) : null;
const seconds = (value: unknown) => Math.floor(new Date(String(value)).getTime() / 1000);

// Same rule the website used when a person has no explicit forename/surname.
function parseName(name: string) {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return { forename: parts[0] ?? "", surname: "" };
	const surname = parts.pop() ?? "";
	return { forename: parts.join(" "), surname };
}

export async function peopleSeed(root = contentRoot): Promise<Seed> {
	const rows: Row[] = [];
	const warnings: string[] = [];
	for (const file of await walk(join(root, "people"))) {
		const { data } = await read(file);
		const id = stem(file);
		if (data.id && data.id !== id) warnings.push(`people/${id}: frontmatter id "${data.id}" differs from the file name; using the file name`);
		const parsed = parseName(String(data.name ?? ""));
		rows.push({
			id,
			name: String(data.name ?? ""),
			forename: data.forename ?? parsed.forename,
			surname: data.surname ?? parsed.surname,
			github: optional(data.github),
			twitter: optional(data.twitter),
			bluesky: optional(data.bluesky),
			linkedin: optional(data.linkedin),
			mastodon: optional(data.mastodon),
			website: optional(data.website),
			youtube: optional(data.youtube),
		});
	}
	return { table: "people", rows, warnings };
}

export async function technologiesSeed(root = contentRoot): Promise<Seed> {
	const rows: Row[] = [];
	const warnings: string[] = [];
	for (const file of await walk(join(root, "technologies"))) {
		if (basename(file) !== "index.mdx" && basename(file) !== "index.md") continue;
		const id = basename(dirname(file));
		const { data, body } = await read(file);
		const parsed = technologyZod.safeParse(data);
		if (!parsed.success) {
			warnings.push(`technologies/${id}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`);
			continue;
		}
		const t = parsed.data;
		rows.push({
			id,
			name: t.name,
			description: body,
			website: optional(t.website),
			documentation: optional(t.documentation),
			source: optional(t.source),
			license: t.license,
			status: t.status,
			category: optional(t.category),
			subcategory: optional(t.subcategory),
			aliases: list(t.aliases),
			related_technologies: list(t.relatedTechnologies),
			use_cases: list(t.useCases),
			features: list(t.features),
			learning_resources: optional(t.learningResources),
			logos: optional(t.logos),
			cncf: optional(t.cncf),
			community: optional(t.community),
			matrix: optional(t.matrix),
			seo: optional(t.seo),
		});
	}
	return { table: "technologies", rows, warnings };
}

export async function showsSeed(root = contentRoot): Promise<Seed> {
	const rows: Row[] = [];
	const warnings: string[] = [];
	for (const file of await walk(join(root, "shows"))) {
		const { data } = await read(file);
		const id = String(data.id ?? stem(file));
		const cover = data.cover as { image?: string; alt?: string } | undefined;
		// Local cover images need a CDN home before they can be referenced.
		if (cover?.image && !/^https?:\/\//.test(cover.image)) warnings.push(`shows/${id}: cover ${cover.image} is a local file; upload it and set cover_url`);
		rows.push({
			id,
			name: String(data.name),
			description: optional(data.description),
			tagline: optional(data.tagline),
			status: data.status ?? "active",
			published: data.publish === true,
			game_format_url: optional(data.gameFormatUrl),
			cover_url: cover?.image && /^https?:\/\//.test(cover.image) ? cover.image : null,
			cover_alt: optional(cover?.alt),
			podcast: optional(data.podcast),
			subscribe_links: list(data.subscribeLinks) ? data.subscribeLinks : null,
		});
	}
	return { table: "shows", rows, warnings };
}

export async function videosSeed(root = contentRoot): Promise<Seed> {
	const rows: Row[] = [];
	const warnings: string[] = [];
	for (const file of await walk(join(root, "videos"))) {
		const { data } = await read(file);
		if (!data.id || !data.slug) {
			warnings.push(`${file}: missing id or slug; skipped`);
			continue;
		}
		rows.push({
			id: String(data.id),
			title: String(data.title),
			subtitle: optional(data.subtitle),
			tagline: optional(data.tagline),
			slug: String(data.slug),
			description: String(data.description),
			what_you_will_learn: list(data.whatYouWillLearn),
			duration: optional(data.duration),
			audio_file_size: optional(data.audioFileSize),
			publishedAt: seconds(data.publishedAt),
			type: optional(data.type),
			category: optional(data.category),
			youtube_id: optional(data.youtubeId),
			realtime_kit: optional(data.realtimeKit),
			resources: list(data.resources) ? data.resources : null,
		});
	}
	return { table: "videos", rows, warnings };
}

// ---- Join services -------------------------------------------------------
// Each relationship lives in its own service, keyed by the ids above.

const ref = (value: unknown): string =>
	typeof value === "object" && value !== null ? String((value as { id: unknown }).id) : String(value);
const refs = (value: unknown): string[] => (Array.isArray(value) ? value.map(ref) : []);

async function videoEntries(root: string) {
	const entries: { data: Record<string, any>; file: string }[] = [];
	for (const file of await walk(join(root, "videos"))) {
		const { data } = await read(file);
		if (data.id && data.slug) entries.push({ data, file });
	}
	return entries;
}

// Drops rows whose primary key was already seen, so a duplicate in frontmatter
// warns instead of failing the whole seed.
function unique(rows: Row[], key: (row: Row) => string, warnings: string[], label: string) {
	const seen = new Set<string>();
	return rows.filter((row) => {
		const k = key(row);
		if (seen.has(k)) {
			warnings.push(`${label}: duplicate ${k}; kept the first`);
			return false;
		}
		seen.add(k);
		return true;
	});
}

export async function videoGuestsSeed(root = contentRoot): Promise<Seed> {
	const warnings: string[] = [];
	const rows: Row[] = [];
	for (const { data } of await videoEntries(root))
		refs(data.guests).forEach((guest, position) => rows.push({ video_id: String(data.id), guest_id: guest, position }));
	return { table: "video_guests", rows: unique(rows, (r) => `${r.video_id}/${r.guest_id}`, warnings, "video_guests"), warnings };
}

export async function videoTechnologiesSeed(root = contentRoot): Promise<Seed> {
	const warnings: string[] = [];
	const rows: Row[] = [];
	for (const { data } of await videoEntries(root))
		refs(data.technologies).forEach((technology, position) =>
			// Collection ids carried an "/index" suffix, which is what broke the old join.
			rows.push({ video_id: String(data.id), technology_id: technology.replace(/\/index$/, ""), position }),
		);
	return {
		table: "video_technologies",
		rows: unique(rows, (r) => `${r.video_id}/${r.technology_id}`, warnings, "video_technologies"),
		warnings,
	};
}

export async function showHostsSeed(root = contentRoot): Promise<Seed> {
	const warnings: string[] = [];
	const rows: Row[] = [];
	for (const file of await walk(join(root, "shows"))) {
		const { data } = await read(file);
		const id = String(data.id ?? stem(file));
		refs(data.hosts).forEach((host, position) => rows.push({ show_id: id, host_id: host, position }));
	}
	return { table: "show_hosts", rows: unique(rows, (r) => `${r.show_id}/${r.host_id}`, warnings, "show_hosts"), warnings };
}

// Same rule the website used: S01E02 / E02 from the slug, else the slug.
export function deriveEpisodeCode(slug: string): string {
	const match = slug.match(/(?:s(\d+))?e(\d+)/i);
	if (!match?.[2]) return slug;
	const episode = `E${match[2].padStart(2, "0")}`;
	return match[1] ? `S${match[1].padStart(2, "0")}${episode}` : episode;
}

export async function episodesSeed(root = contentRoot): Promise<Seed> {
	const warnings: string[] = [];
	const rows: Row[] = [];
	const codes = new Set<string>();
	for (const { data } of await videoEntries(root)) {
		if (!data.show) continue;
		const showId = ref(data.show);
		let code = deriveEpisodeCode(String(data.slug));
		// (showId, code) is unique; the website silently returned the first match.
		if (codes.has(`${showId}/${code.toLowerCase()}`)) {
			warnings.push(`episodes: ${showId} already has ${code}; ${data.slug} uses its slug as the code`);
			code = String(data.slug);
		}
		codes.add(`${showId}/${code.toLowerCase()}`);
		rows.push({ videoId: String(data.id), showId, code });
	}
	return { table: "episodes", rows, warnings };
}

export async function chaptersSeed(root = contentRoot): Promise<Seed> {
	const warnings: string[] = [];
	const rows: Row[] = [];
	for (const { data } of await videoEntries(root))
		for (const chapter of Array.isArray(data.chapters) ? data.chapters : [])
			rows.push({ video_id: String(data.id), seconds: Math.floor(Number(chapter.startTime)), title: String(chapter.title) });
	return { table: "chapters", rows: unique(rows, (r) => `${r.video_id}@${r.seconds}`, warnings, "chapters"), warnings };
}

export async function peopleLinksSeed(root = contentRoot): Promise<Seed> {
	const warnings: string[] = [];
	const rows: Row[] = [];
	for (const file of await walk(join(root, "people"))) {
		const { data } = await read(file);
		const links = Array.isArray(data.links) ? (data.links as { url: string; name: string }[]) : [];
		links.forEach((link, position) => rows.push({ person_id: stem(file), url: String(link.url), name: String(link.name), position }));
	}
	return { table: "people_links", rows: unique(rows, (r) => `${r.person_id}/${r.url}`, warnings, "people_links"), warnings };
}

export async function peopleBiographiesSeed(root = contentRoot): Promise<Seed> {
	const rows: Row[] = [];
	for (const file of await walk(join(root, "people"))) {
		const { body } = await read(file);
		if (body) rows.push({ person_id: stem(file), biography: body });
	}
	return { table: "people_biographies", rows, warnings: [] };
}

export async function transcriptionTermsSeed(root = contentRoot): Promise<Seed> {
	const warnings: string[] = [];
	const rows: Row[] = [];
	const add = (kind: string, foreignId: string, terms: unknown) => {
		for (const term of list(terms) ?? []) rows.push({ kind, foreignId, term });
	};
	for (const { data } of await videoEntries(root)) {
		add("video", String(data.id), data.terms);
		// Episodes carried their video's terms.
		if (data.show) add("episode", `${ref(data.show)}-${data.id}`, data.terms);
	}
	for (const file of await walk(join(root, "shows"))) {
		const { data } = await read(file);
		add("show", String(data.id ?? stem(file)), data.terms);
	}
	for (const file of await walk(join(root, "people"))) add("person", stem(file), (await read(file)).data.terms);
	for (const file of await walk(join(root, "technologies"))) {
		if (!/^index\.mdx?$/.test(basename(file))) continue;
		add("technology", basename(dirname(file)), (await read(file)).data.terms);
	}
	return {
		table: "transcription_terms",
		rows: unique(rows, (r) => `${r.kind}/${r.foreignId}/${r.term}`, warnings, "transcription_terms"),
		warnings,
	};
}

export const seeds = {
	people: peopleSeed,
	technologies: technologiesSeed,
	shows: showsSeed,
	videos: videosSeed,
	"video-guests": videoGuestsSeed,
	"video-technologies": videoTechnologiesSeed,
	"show-hosts": showHostsSeed,
	episodes: episodesSeed,
	chapters: chaptersSeed,
	"people-links": peopleLinksSeed,
	"people-biographies": peopleBiographiesSeed,
	"transcription-terms": transcriptionTermsSeed,
} as const;

const literal = (value: Row[string]): string => {
	if (value === null || value === undefined) return "NULL";
	if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
	if (typeof value === "boolean") return value ? "1" : "0";
	const text = typeof value === "string" ? value : JSON.stringify(value);
	return `'${text.replaceAll("'", "''")}'`;
};

// Replaces every row: the seed is a full snapshot of git at export time.
export function toSql(seed: Seed): string[] {
	const statements = [`DELETE FROM \`${seed.table}\``];
	for (const row of seed.rows) {
		const columns = Object.keys(row).map((column) => `\`${column}\``).join(", ");
		const values = Object.values(row).map(literal).join(", ");
		statements.push(`INSERT INTO \`${seed.table}\` (${columns}) VALUES (${values})`);
	}
	return statements;
}

async function main() {
	const { values } = parseArgs({ options: { out: { type: "string" } } });
	const out = values.out;
	if (!out) throw new Error("Pass --out <directory> (outside the repository; seeds are large and regenerated on demand)");
	await mkdir(out, { recursive: true });
	for (const [service, build] of Object.entries(seeds)) {
		const seed = await build();
		await writeFile(join(out, `${service}.sql`), `${toSql(seed).join(";\n")};\n`);
		console.log(`${service}: ${seed.rows.length} rows`);
		for (const warning of seed.warnings) console.warn(`  ${warning}`);
	}
}

if (import.meta.main) await main();
