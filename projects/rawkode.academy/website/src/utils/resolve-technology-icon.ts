import { join, dirname as pathDirname, basename } from "node:path";
import { resolveDataDirSync } from "@rawkodeacademy/content-technologies";

export function resolveTechnologyIconUrl(entryId: string, icon: unknown): string | undefined {
  // If already an Astro ImageMetadata, prefer .src
  if (icon && typeof icon === "object" && (icon as any).src) {
    return (icon as any).src as string;
  }

  if (typeof icon !== "string") return undefined;
  // Remote URL passthrough
  if (/^https?:\/\//i.test(icon)) return icon;

  // For relative paths like "./id.svg", create a dev-safe @fs URL.
  try {
    const base = resolveDataDirSync();
    const subdir = entryId.includes("/") ? pathDirname(entryId) : "";
    const abs = join(base, subdir, icon);
    if (import.meta.env.DEV) {
      return "/@fs/" + abs;
    }
    // In production builds, prefer the content CDN for technology logos.
    // Fall back to the basename of the icon file.
    const file = basename(icon);
    return `https://content.rawkode.academy/logos/technologies/${file}`;
  } catch {}
  return icon;
}
