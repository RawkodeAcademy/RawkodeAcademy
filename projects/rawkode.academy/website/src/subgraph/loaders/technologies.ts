// Lazy content loader for Technology records from Astro content.
// We derive types directly from the technologies collection schema
// to ensure compile-time safety with zero drift.
import type { CollectionEntry } from "astro:content";

export type TechnologyEntry = CollectionEntry<"technologies">;
export type TechnologyData = TechnologyEntry["data"];
export type LearningResources = NonNullable<TechnologyData["learningResources"]>;
export type TechnologyItem = TechnologyData & { id: string; logo?: string };

export async function listTechnologies(): Promise<TechnologyItem[]> {
  const { getCollection } = await import("astro:content");
  const { resolveTechnologyIconUrl } = await import("../../utils/resolve-technology-icon");

  const items = await getCollection("technologies");
  return items.map((e: TechnologyEntry) => {
    const iconValue = resolveTechnologyIconUrl(e.id, (e as any).data.icon);
    return {
      id: e.id,
      ...e.data,
      icon: iconValue,
      logo: iconValue,
      categories: e.data.categories ?? [],
      learningResources: (e.data.learningResources as TechnologyData["learningResources"]) ?? null,
    } satisfies TechnologyItem;
  });
}

export async function getTechnologyById(id: string): Promise<TechnologyItem | null> {
  const list = await listTechnologies();
  return list.find((t) => t.id === id) ?? null;
}
