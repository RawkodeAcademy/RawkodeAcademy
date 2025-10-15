import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { stat } from "node:fs/promises";
import { statSync } from "node:fs";

// Minimal Zod surface expected from Astro's content config `z`
type Z = {
  object: any;
  string: any;
  array: any;
  enum: any;
  boolean: any;
  number: any;
  record: any;
  union?: any;
};

export type TechnologyStatus = "active" | "preview" | "deprecated";

// Export a schema factory colocated with the content package.
// Consumers (e.g., the website's content config) will call this with their `z`.
export function createSchema(z: Z, _helpers?: { image?: (opts?: any) => any }) {
  return z.object({
    // Core identity
    name: z.string(),
    description: z.string(),

    // Presentation: keep as string to avoid image metadata parsing issues with some SVGs.
    // Accept either remote URLs or relative paths ("./logo.svg").
    icon: z.string(),

    // Links
    website: z.string(),
    source: z.string().optional(),
    documentation: z.string().optional(),

    // Taxonomy / relationships
    categories: z.array(z.string()).default([]),
    aliases: z.array(z.string()).optional(),
    relatedTechnologies: z.array(z.string()).optional(),

    // Content hints
    useCases: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    learningResources: z
      .object({
        official: z.array(z.string()).optional(),
        community: z.array(z.string()).optional(),
        tutorials: z.array(z.string()).optional(),
      })
      .optional(),

    // Lifecycle
    status: (z.enum as any)(["active", "preview", "deprecated"]).default("active"),
  });
}

// Resolve the absolute directory for data files inside this package.
// Prefers the `data/` subdirectory if present; falls back to the package root
// to remain compatible with existing JSON files at the package root.
export async function resolveDataDir(): Promise<string> {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("@rawkodeacademy/content-technologies/package.json");
  const root = dirname(pkgPath);
  const dataDir = join(root, "data");
  try {
    const s = await stat(dataDir);
    if (s.isDirectory()) return dataDir;
  } catch {}
  return root;
}

export function resolveDataDirSync(): string {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("@rawkodeacademy/content-technologies/package.json");
  const root = dirname(pkgPath);
  const dataDir = join(root, "data");
  try {
    const s = statSync(dataDir);
    if (s.isDirectory()) return dataDir;
  } catch {}
  return root;
}
