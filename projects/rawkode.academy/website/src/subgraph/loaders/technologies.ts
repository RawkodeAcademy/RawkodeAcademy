// Lazy content loader for Technology records coming from Astro content.
// NOTE: Uses dynamic imports to avoid hard dependencies at module load time,
// so schema printing (SDL generation) can run in Node/Bun without Astro runtime.

export interface LearningResources {
  official?: string[];
  community?: string[];
  tutorials?: string[];
}

export interface TechnologyItem {
  id: string;
  name: string;
  description: string;
  icon?: string;
  logo?: string;
  website: string;
  source?: string;
  documentation?: string;
  categories?: string[];
  aliases?: string[];
  relatedTechnologies?: string[];
  useCases?: string[];
  features?: string[];
  learningResources?: LearningResources | null;
  status?: string;
}

export async function listTechnologies(): Promise<TechnologyItem[]> {
  const { getCollection } = await import("astro:content");
  const { resolveTechnologyIconUrl } = await import("../../utils/resolve-technology-icon");

  const items = await getCollection("technologies");
  return items.map((e: any) => {
    const iconValue = resolveTechnologyIconUrl(e.id, e.data.icon);
    return {
      id: e.id,
      name: e.data.name,
      description: e.data.description,
      icon: iconValue,
      logo: iconValue,
      website: e.data.website,
      source: e.data.source,
      documentation: e.data.documentation,
      categories: e.data.categories ?? [],
      aliases: e.data.aliases,
      relatedTechnologies: e.data.relatedTechnologies,
      useCases: e.data.useCases,
      features: e.data.features,
      learningResources: e.data.learningResources ?? null,
      status: e.data.status,
    } satisfies TechnologyItem;
  });
}

export async function getTechnologyById(id: string): Promise<TechnologyItem | null> {
  const list = await listTechnologies();
  return list.find((t) => t.id === id) ?? null;
}
