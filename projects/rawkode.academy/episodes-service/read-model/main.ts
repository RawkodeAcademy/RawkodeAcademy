import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { createClient } from "@libsql/client";
import * as path from "@std/path";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { parse } from "graphql";
import * as dataSchema from "../data-model/schema.ts";

if (!Deno.env.has("LIBSQL_URL")) {
	Deno.env.set("LIBSQL_URL", "http://localhost:2000");
}

if (!Deno.env.has("LIBSQL_TOKEN")) {
	Deno.env.set("LIBSQL_TOKEN", "");
}

const client = createClient({
	url: Deno.env.get("LIBSQL_URL") || "",
	authToken: Deno.env.get("LIBSQL_TOKEN"),
});

const db = drizzle(client, { schema: dataSchema });

const resolvers = {
	Show: {
		__resolveReference({ code }: { code: string }) {
			const show = db.query.episodesTable.findFirst({
				where: eq(dataSchema.episodesTable.code, code),
			});

			if (!show) {
				throw new Error(
					`Episode with code ${code} not found`,
				);
			}

			return show;
		},
	},
	Query: {
		episodes() {
			return db.select().from(dataSchema.episodesTable);
		},
		episodesByCode(code: string) {
			return db.select().from(dataSchema.episodesTable).where(
				eq(dataSchema.episodesTable.code, code),
			).limit(1);
		},
		episodesByShow(showId: string) {
			return db.select().from(dataSchema.episodesTable).where(
				eq(dataSchema.episodesTable.showId, showId),
			);
		},
	},
};

const schema = buildSubgraphSchema({
	typeDefs: parse(
		Deno.readTextFileSync(
			`${path.dirname(path.fromFileUrl(import.meta.url))}/schema.graphql`,
		),
	),
	resolvers,
});

const server = new ApolloServer({
	schema,
	introspection: true,
});

const { url } = await startStandaloneServer(server, {
	listen: { port: 8000 },
});

console.log(`Server running on: ${url}`);
