import type { D1Database } from "@cloudflare/workers-types";
import schemaBuilder from "@pothos/core";
import directivesPlugin from "@pothos/plugin-directives";
import federationPlugin from "@pothos/plugin-federation";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { GraphQLSchema } from "graphql";
import * as s from "../data-model/schema";

export interface PothosTypes {
	Context: Record<string, unknown>;
}

const subgraph = {
	linkUrl: "https://specs.apollo.dev/federation/v2.6",
	federationDirectives: ["@extends", "@external", "@key"],
};

export const getSchema = (env: { DB: D1Database }): GraphQLSchema => {
	const db = drizzle(env.DB, { schema: s });
	const builder = new schemaBuilder<PothosTypes>({
		plugins: [directivesPlugin, federationPlugin],
	});
	const t = s.peopleBiographies;

	builder.externalRef("Person", builder.selection<{ id: string }>("id")).implement({
		externalFields: (f) => ({ id: f.string() }),
		fields: (f) => ({
			// Markdown. Empty when the person has no biography.
			biography: f.string({
				nullable: true,
				resolve: async (person) =>
					(await db.select({ biography: t.biography }).from(t).where(eq(t.personId, person.id)).get())
						?.biography ?? "",
			}),
		}),
	});

	return builder.toSubGraphSchema(subgraph);
};
