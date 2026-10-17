import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

// Resolve the absolute directory for content files inside this package.
// We check if we are inside the package structure and locate the root of the package.
// Since the content files (technologies, articles, etc.) will be siblings to src/ or package.json,
// we resolve relative to package.json.

export function payloadContentRoot(): string {
  return resolve(process.env.ACADEMY_CONTENT_ROOT || ".content/payload");
}

export async function resolveContentDir(subpath: string = ""): Promise<string> {
  return resolveContentDirSync(subpath);
}

export function resolveContentDirSync(subpath: string = ""): string {
  // With ACADEMY_CONTENT_SOURCE=payload the website builds from the tree its
  // build exported from Payload, which replaces the checked-in one wholesale so
  // every reader sees one source. Relative roots resolve from the build's cwd.
  if (process.env.ACADEMY_CONTENT_SOURCE === "payload") {
    return join(payloadContentRoot(), subpath);
  }
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("@rawkodeacademy/content/package.json");
  const root = dirname(pkgPath);
  // Always return the collection's own directory, even when it does not
  // exist yet or has emptied out. Falling back to the content root would
  // hand a glob loader every entry in the repository, so an empty
  // collection would swallow other collections' files and fail their schema.
  return join(root, subpath);
}
