import type { D1Database } from "@cloudflare/workers-types";
import schemaBuilder from "@pothos/core";
import directivesPlugin from "@pothos/plugin-directives";
import federationPlugin from "@pothos/plugin-federation";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { GraphQLSchema } from "graphql";
import * as s from "../data-model/schema";

type Technology = s.Technology;

export interface PothosTypes {
	Context: Record<string, unknown>;
}

const cdn = "https://content.rawkode.academy";
// Icons are published from content/technologies/<id>/icon.svg to the same path
// on the CDN. The legacy logos/technologies/<id>.svg set is only a fallback.
const logoCdn = `${cdn}/logos/technologies`;

// Logos are served from the content CDN instead of being bundled from git.
export const iconUrl = (technology: Pick<Technology, "id" | "logos">) =>
	technology.logos?.icon ? `${cdn}/technologies/${technology.id}/icon.svg` : null;

export const getSchema = (env: { DB: D1Database }): GraphQLSchema => {
	const db = drizzle(env.DB, { schema: s });
	const builder = new schemaBuilder<PothosTypes>({
		plugins: [directivesPlugin, federationPlugin],
	});

	const byId = (id: string) =>
		db
			.select()
			.from(s.technologiesTable)
			.where(eq(s.technologiesTable.id, id))
			.get();

	const LearningResourcesRef =
		builder.objectRef<s.LearningResources>("LearningResources");
	builder.objectType(LearningResourcesRef, {
		fields: (t) => ({
			official: t.stringList({ resolve: (lr) => lr.official ?? [] }),
			community: t.stringList({ resolve: (lr) => lr.community ?? [] }),
			tutorials: t.stringList({ resolve: (lr) => lr.tutorials ?? [] }),
		}),
	});

	const TechnologyRef = builder.objectRef<Technology>("Technology");
	builder.objectType(TechnologyRef, {
		fields: (t) => ({
			id: t.exposeID("id"),
			name: t.exposeString("name"),
			description: t.exposeString("description"),
			icon: t.string({ nullable: true, resolve: (r) => iconUrl(r) }),
			// Kept for older clients: always a URL.
			logo: t.string({
				resolve: (r) => iconUrl(r) ?? `${logoCdn}/${r.id}.svg`,
			}),
			website: t.string({ resolve: (r) => r.website ?? "" }),
			source: t.string({ nullable: true, resolve: (r) => r.source }),
			documentation: t.string({ resolve: (r) => r.documentation ?? "" }),
			license: t.exposeString("license"),
			category: t.string({ nullable: true, resolve: (r) => r.category }),
			subcategory: t.string({ nullable: true, resolve: (r) => r.subcategory }),
			status: t.string({ nullable: true, resolve: (r) => r.status }),
			aliases: t.stringList({ nullable: true, resolve: (r) => r.aliases }),
			relatedTechnologies: t.stringList({
				nullable: true,
				resolve: (r) => r.relatedTechnologies,
			}),
			useCases: t.stringList({ nullable: true, resolve: (r) => r.useCases }),
			features: t.stringList({ nullable: true, resolve: (r) => r.features }),
			learningResources: t.field({
				type: LearningResourcesRef,
				nullable: true,
				resolve: (r) => r.learningResources,
			}),
		}),
	});

	builder.asEntity(TechnologyRef, {
		key: builder.selection<{ id: string }>("id"),
		resolveReference: (ref) => byId(ref.id),
	});

	builder.queryType({
		fields: (t) => ({
			technologyById: t.field({
				type: TechnologyRef,
				nullable: true,
				args: { id: t.arg.string({ required: true }) },
				resolve: (_root, args) => byId(args.id),
			}),
			getTechnologies: t.field({
				type: [TechnologyRef],
				args: {
					limit: t.arg.int({ defaultValue: 15 }),
					offset: t.arg.int({ defaultValue: 0 }),
				},
				resolve: (_root, args) =>
					db
						.select()
						.from(s.technologiesTable)
						.orderBy(asc(s.technologiesTable.id))
						.limit(args.limit ?? 15)
						.offset(args.offset ?? 0)
						.all(),
			}),
		}),
	});

	return builder.toSubGraphSchema({
		linkUrl: "https://specs.apollo.dev/federation/v2.6",
		federationDirectives: ["@key"],
	});
};
