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

export const seeds = {
	people: peopleSeed,
	technologies: technologiesSeed,
	shows: showsSeed,
	videos: videosSeed,
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
