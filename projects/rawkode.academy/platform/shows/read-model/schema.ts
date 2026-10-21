import type { D1Database } from "@cloudflare/workers-types";
import schemaBuilder from "@pothos/core";
import directivesPlugin from "@pothos/plugin-directives";
import federationPlugin from "@pothos/plugin-federation";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { GraphQLSchema } from "graphql";
import * as s from "../data-model/schema";

type Show = s.Show;

export interface PothosTypes {
	Context: Record<string, unknown>;
}

export const getSchema = (env: { DB: D1Database }): GraphQLSchema => {
	const db = drizzle(env.DB, { schema: s });
	const builder = new schemaBuilder<PothosTypes>({
		plugins: [directivesPlugin, federationPlugin],
	});

	const byId = (id: string) =>
		db.select().from(s.showsTable).where(eq(s.showsTable.id, id)).get();

	const ShowStatusEnum = builder.enumType("ShowStatus", {
		values: ["coming_soon", "active", "archived"] as const,
	});

	const ShowRef = builder.objectRef<Show>("Show");
	builder.objectType(ShowRef, {
		fields: (t) => ({
			id: t.exposeString("id"),
			name: t.exposeString("name"),
			description: t.string({ nullable: true, resolve: (r) => r.description }),
			tagline: t.string({ nullable: true, resolve: (r) => r.tagline }),
			status: t.field({
				type: ShowStatusEnum,
				resolve: (r) => (r.status === "coming-soon" ? "coming_soon" : r.status),
			}),
			published: t.exposeBoolean("published"),
			gameFormatUrl: t.string({
				nullable: true,
				resolve: (r) => r.gameFormatUrl,
			}),
			coverUrl: t.string({ nullable: true, resolve: (r) => r.coverUrl }),
			coverAlt: t.string({ nullable: true, resolve: (r) => r.coverAlt }),
		}),
	});

	builder.asEntity(ShowRef, {
		key: builder.selection<{ id: string }>("id"),
		resolveReference: (ref) => byId(ref.id),
	});

	builder.queryType({
		fields: (t) => ({
			showById: t.field({
				type: ShowRef,
				nullable: true,
				args: { id: t.arg.string({ required: true }) },
				resolve: (_root, args) => byId(args.id),
			}),
			allShows: t.field({
				type: [ShowRef],
				resolve: () =>
					db.select().from(s.showsTable).orderBy(asc(s.showsTable.id)).all(),
			}),
		}),
	});

	return builder.toSubGraphSchema({
		linkUrl: "https://specs.apollo.dev/federation/v2.6",
		federationDirectives: ["@key"],
	});
};
