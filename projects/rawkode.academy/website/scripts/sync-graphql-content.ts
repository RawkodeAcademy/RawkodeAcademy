/*
  Sync GraphQL data into local Astro content collections.

  Generates Markdown files under:
    - content/videos
    - content/shows
    - content/technologies

  Usage:
    - npm run sync:content
    - or: npx tsx scripts/sync-graphql-content.ts

  Configuration:
    - Reads GRAPHQL_ENDPOINT from env, defaults to https://api.rawkode.academy/graphql
*/

import { mkdir, writeFile, rm, stat, readdir } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import { GraphQLClient, gql } from "graphql-request";

type Host = { forename: string; surname: string };

type Video = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  publishedAt: string;
  streamUrl: string;
  thumbnailUrl: string;
  duration: number;
  technologies: Array<{ id: string; name: string; logo: string }>;
  episode?: { show?: { id: string; name: string; hosts?: Host[] | null } | null } | null;
};

type Show = {
  id: string;
  name: string;
  hosts?: Host[] | null;
};

type Technology = {
  id: string;
  name: string;
  description: string;
  website?: string | null;
  documentation?: string | null;
  logo?: string | null;
};

const endpoint = process.env.GRAPHQL_ENDPOINT || "https://api.rawkode.academy/graphql";
const client = new GraphQLClient(endpoint, {
  headers: process.env.GRAPHQL_TOKEN ? { Authorization: `Bearer ${process.env.GRAPHQL_TOKEN}` } : undefined,
});

// Prefer robust YAML serialization if available; fallback to minimal emitter
let YAML: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  YAML = await import('yaml');
} catch {}

// --- Minimal YAML emitter for our frontmatter shapes (fallback) ---
function esc(str: string): string {
  // Escape double quotes and newlines for quoted scalars
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function emitScalar(value: unknown, indent: string): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") {
    if (value.includes("\n")) {
      const lines = value.split(/\r?\n/);
      return `|\n${lines.map((l) => `${indent}${l}`).join("\n")}`;
    }
    return `"${esc(value)}"`;
  }
  if (Array.isArray(value)) return emitArray(value, indent);
  return emitObject(value as Record<string, unknown>, indent);
}

function emitArray(arr: unknown[], indent: string): string {
  if (arr.length === 0) return "[]";
  const next = indent + "  ";
  return arr
    .map((item) => {
      const rendered = emitScalar(item, next);
      const isObject = item !== null && typeof item === "object";
      const isMultilineString = typeof item === "string" && item.includes("\n");
      const complex = isObject || isMultilineString || rendered.includes("\n");
      if (complex) {
        // Place the dash on its own line, then the nested content indented
        return `${indent}-\n${rendered}`;
      }
      return `${indent}- ${rendered}`;
    })
    .join("\n");
}

function emitObject(obj: Record<string, unknown>, indent: string): string {
  const keys = Object.keys(obj);
  if (keys.length === 0) return "{}";
  const next = indent + "  ";
  return keys
    .map((k) => {
      const value = obj[k];
      const rendered = emitScalar(value, next);
      const isArray = Array.isArray(value);
      const isObj = value !== null && typeof value === "object" && !isArray;
      const isMultiline = rendered.includes("\n") || rendered.startsWith("|");
      if (isArray) {
        // Inline only empty arrays; otherwise break line and indent list items
        if ((value as unknown[]).length === 0) {
          return `${indent}${k}: ${rendered}`; // []
        }
        return `${indent}${k}:\n${rendered}`; // \n  - item
      }
      if (isObj) {
        // Inline only empty objects; otherwise break line
        if (Object.keys(value as Record<string, unknown>).length === 0) {
          return `${indent}${k}: ${rendered}`; // {}
        }
        return `${indent}${k}:\n${rendered}`;
      }
      if (isMultiline) {
        // For block scalars (rendered starts with '|'), keep 'key: |' on same line
        if (rendered.startsWith('|')) {
          return `${indent}${k}: ${rendered}`;
        }
        return `${indent}${k}:\n${rendered}`;
      } else {
        return `${indent}${k}: ${rendered}`;
      }
    })
    .join("\n");
}

function toFrontmatter(data: Record<string, unknown>): string {
  // Ensure stable key order for readability
  const ordered: Record<string, unknown> = {};
  const order = [
    "id",
    "slug",
    "title",
    "subtitle",
    "description",
    "publishedAt",
    "technologies",
    "show",
    "name",
    "hosts",
    "website",
    "documentation",
    "categories",
  ];
  for (const key of order) if (key in data) ordered[key] = data[key];
  for (const key of Object.keys(data)) if (!(key in ordered)) ordered[key] = data[key];

  if (YAML && typeof YAML.stringify === 'function') {
    const yaml = YAML.stringify(ordered, { lineWidth: 0 });
    return `---\n${yaml}---\n\n`;
  } else {
    const yaml = emitObject(ordered, "");
    return `---\n${yaml}\n---\n\n`;
  }
}

async function ensureDir(path: string) {
  try {
    await mkdir(path, { recursive: true });
  } catch {}
}

async function cleanStaleTree(rootDir: string, keepRelPathsNoExt: Set<string>) {
  // Recursively walk and remove files not in keep set; prune empty dirs
  async function walk(current: string, rel: string) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return false;
    }

    let hasFiles = false;
    for (const e of entries) {
      const abs = join(current, e.name);
      const relPath = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        const kept = await walk(abs, relPath);
        if (!kept) {
          try { await rm(abs, { recursive: true, force: true }); } catch {}
        } else {
          hasFiles = true;
        }
      } else if (/\.(md|mdx)$/i.test(e.name)) {
        const noExt = relPath.replace(/\.(md|mdx)$/i, "");
        if (!keepRelPathsNoExt.has(noExt)) {
          try { await rm(abs, { force: true }); } catch {}
        } else {
          hasFiles = true;
        }
      } else {
        hasFiles = true; // ignore other files
      }
    }
    return hasFiles;
  }
  await walk(rootDir, "");
}

async function fetchAllVideos(): Promise<Video[]> {
  const query = gql/* GraphQL */ `
    query GetLatestVideos($limit: Int!, $offset: Int!) {
      getLatestVideos(limit: $limit, offset: $offset) {
        id
        slug
        title
        subtitle
        description
        publishedAt
        streamUrl
        thumbnailUrl
        duration
        technologies { id name logo }
        episode { show { id name hosts { forename surname } } }
      }
    }
  `;

  const limit = 200;
  let offset = 0;
  const all: Video[] = [];
  // paginate until fewer than limit returned
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const resp: { getLatestVideos: Video[] } = await client.request(query, { limit, offset });
    const batch = resp.getLatestVideos || [];
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return all;
}

async function fetchAllShows(): Promise<Show[]> {
  const query = gql/* GraphQL */ `
    query AllShows {
      allShows {
        id
        name
        hosts { forename surname }
      }
    }
  `;
  const resp: { allShows?: (Show | null)[] | null } = await client.request(query);
  return (resp.allShows || []).filter((s): s is Show => Boolean(s && s.id && s.name));
}

async function fetchAllTechnologies(): Promise<Technology[]> {
  const query = gql/* GraphQL */ `
    query GetTechnologies($limit: Int) {
      getTechnologies(limit: $limit) {
        id
        name
        description
        website
        documentation
        logo
      }
    }
  `;
  const resp: { getTechnologies: Technology[] } = await client.request(query, { limit: 1000 });
  return resp.getTechnologies || [];
}

function posixPath(...parts: string[]) {
  return parts.join("/");
}

function videoRelPath(v: Video, date: Date): string {
  const year = date.getUTCFullYear();
  const showId = v.episode?.show?.id;
  return showId
    ? posixPath("shows", showId, String(year), v.slug)
    : posixPath("standalone", String(year), v.slug);
}

async function writeVideo(v: Video) {
  const videosRoot = "content/videos";
  const d = new Date(v.publishedAt);
  if (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    d.setUTCHours(17, 0, 0, 0);
  }
  const relNoExt = videoRelPath(v, d);
  const dir = join(videosRoot, dirname(relNoExt));
  await ensureDir(dir);
  const file = join(videosRoot, `${relNoExt}.md`);
  const fm = toFrontmatter({
    id: v.slug,
    slug: v.slug,
    videoId: v.id,
    title: v.title,
    subtitle: v.subtitle || undefined,
    description: v.description,
    publishedAt: d.toISOString(),
    technologies: (v.technologies || []).map((t) => t.id),
    show: v.episode?.show ? v.episode.show.id : undefined,
  });
  await writeFile(file, fm, "utf8");
  return relNoExt;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function personId(h: Host): string {
  const base = `${h.forename} ${h.surname}`.trim();
  return slugify(base);
}

async function writePerson(h: Host) {
  const id = personId(h);
  const file = join("content/people", `${id}.json`);
  await ensureDir("content/people");
  const payload = { name: `${h.forename} ${h.surname}`.trim(), handle: id };
  try {
    await writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  } catch {}
}

async function writeShow(s: Show) {
  const dir = "content/shows";
  await ensureDir(dir);
  const file = join(dir, `${s.id}.md`);
  const fm = toFrontmatter({
    id: s.id,
    name: s.name,
    hosts: (s.hosts || []).map((h) => personId(h)),
  });
  await writeFile(file, fm, "utf8");
}

async function writeTechnology(t: Technology) {
  const dir = join("content/technologies", t.id);
  await ensureDir(dir);
  const indexFile = join(dir, `index.md`);
  const logoPath = join(dir, `logo.svg`);
  const publicLogoPath = join("public/technologies", t.id, `logo.svg`);
  // Download logo if present
  if (t.logo) {
    try {
      const res = await fetch(t.logo);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(logoPath, buf);
        await ensureDir(join("public/technologies", t.id));
        await writeFile(publicLogoPath, buf);
      }
    } catch (e) {
      console.warn(`Failed to download technology logo for ${t.id}:`, e);
    }
  }
  const fm = toFrontmatter({
    name: t.name,
    description: t.description,
    website: t.website || undefined,
    documentation: t.documentation || undefined,
    categories: [],
  });
  await writeFile(indexFile, fm, "utf8");
}

async function main() {
  console.log(`Syncing content from ${endpoint}`);

  // Videos
  const videos = await fetchAllVideos();
  console.log(`Fetched ${videos.length} videos`);
  await ensureDir("content/videos");
  const rels = await Promise.all(videos.map(writeVideo));
  await cleanStaleTree(
    "content/videos",
    new Set(rels),
  );

  // Shows + People (hosts)
  try {
    const shows = await fetchAllShows();
    console.log(`Fetched ${shows.length} shows`);
    await ensureDir("content/shows");
    // write people (hosts)
    const hostMap = new Map<string, Host>();
    for (const s of shows) {
      for (const h of s.hosts || []) {
        hostMap.set(personId(h), h);
      }
    }
    await ensureDir("content/people");
    await Promise.all(Array.from(hostMap.values()).map(writePerson));
    await Promise.all(shows.map(writeShow));
    await cleanStaleTree(
      "content/shows",
      new Set(shows.map((s) => s.id)),
    );
  } catch (e) {
    console.warn("Skipping shows sync due to error:", e);
  }

  // Technologies
  try {
    const technologies = await fetchAllTechnologies();
    console.log(`Fetched ${technologies.length} technologies`);
    await ensureDir("content/technologies");
    await Promise.all(technologies.map(writeTechnology));
    // Remove technology directories that no longer exist
    await (async function cleanTechDirs() {
      try {
        const entries = await readdir("content/technologies", { withFileTypes: true });
        const keep = new Set(technologies.map((t) => t.id));
        for (const e of entries) {
          const abs = join("content/technologies", e.name);
          if (e.isDirectory() && !keep.has(e.name)) {
            try { await rm(join("content/technologies", e.name), { recursive: true, force: true }); } catch {}
          } else if (e.isFile() && /\.(md|mdx)$/i.test(e.name)) {
            // Remove legacy flat files like acorn.md now that we use directories
            try { await rm(abs, { force: true }); } catch {}
          }
        }
      } catch {}
    })();
  } catch (e) {
    console.warn("Skipping technologies sync due to error:", e);
  }

  console.log("Content sync complete.");
}

main().catch((err) => {
  console.error("Content sync failed:", err);
  process.exitCode = 1;
});
