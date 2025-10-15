export const prerender = false;

import type { APIRoute } from "astro";
import { graphql, buildSchema } from "graphql";
import { getCollection } from "astro:content";
import { resolveTechnologyIconUrl } from "@/utils/resolve-technology-icon";

const sdl = /* GraphQL */ `
  schema {
    query: Query
  }

  type LearningResources {
    official: [String!]
    community: [String!]
    tutorials: [String!]
  }

  type Technology {
    id: ID!
    name: String!
    description: String!
    icon: String!
    logo: String
    website: String!
    source: String
    documentation: String
    categories: [String!]!
    aliases: [String!]
    relatedTechnologies: [String!]
    useCases: [String!]
    features: [String!]
    learningResources: LearningResources
    status: String
  }

  type Query {
    technology(id: ID!): Technology
    technologies(q: String, limit: Int = 50, offset: Int = 0): [Technology!]!
  }
`;

const schema = buildSchema(sdl);

async function listTechnologies() {
  const items = await getCollection("technologies");
  return items.map((e) => {
    const icon = (e as any).data.icon;
    const iconValue = resolveTechnologyIconUrl(e.id, icon);
    return {
      id: e.id,
      name: e.data.name,
      description: e.data.description,
      icon: iconValue,
      website: e.data.website,
      source: e.data.source,
      documentation: e.data.documentation,
      categories: e.data.categories ?? [],
      aliases: e.data.aliases,
      relatedTechnologies: e.data.relatedTechnologies,
      useCases: e.data.useCases,
      features: e.data.features,
      learningResources: e.data.learningResources,
      status: e.data.status,
      logo: iconValue,
    };
  });
}

const root = {
  technology: async ({ id }: { id: string }) => {
    const items = await listTechnologies();
    return items.find((t) => t.id === id) ?? null;
  },
  technologies: async ({
    q,
    limit = 50,
    offset = 0,
  }: {
    q?: string;
    limit?: number;
    offset?: number;
  }) => {
    const items = await listTechnologies();
    let filtered = items;
    if (q) {
      const s = q.toLowerCase();
      filtered = items.filter((t) =>
        [
          t.name,
          t.description,
          ...(Array.isArray(t.categories) ? t.categories : []),
          ...(Array.isArray(t.aliases) ? t.aliases : []),
        ]
          .filter(Boolean)
          .join("\n")
          .toLowerCase()
          .includes(s),
      );
    }
    return filtered.slice(offset, offset + limit);
  },
};

async function handle(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const query = url.searchParams.get("query");
      const variables = url.searchParams.get("variables");
      if (!query) return new Response("Missing query", { status: 400 });
      const result = await graphql({
        schema,
        source: query,
        rootValue: root,
        variableValues: variables ? JSON.parse(variables) : undefined,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const result = await graphql({
        schema,
        source: body.query,
        rootValue: root,
        variableValues: body.variables,
        operationName: body.operationName,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return new Response(
      JSON.stringify({ errors: [{ message: (err as Error).message }] }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

export const GET: APIRoute = ({ request }) => handle(request);
export const POST: APIRoute = ({ request }) => handle(request);
