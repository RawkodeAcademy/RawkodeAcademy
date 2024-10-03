import { buildSubgraphSchema } from '@apollo/subgraph';
import { createClient } from "@libsql/client";
import * as path from "@std/path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { parse } from 'graphql';
import { createYoga } from "graphql-yoga";
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
	Query: {
		Person: {
			shows(person: { id: string }) {
				return db.select({
					id: dataSchema.showHostsTable.showId,
				}).from(dataSchema.showHostsTable).where(eq(dataSchema.showHostsTable.hostId, person.id));
			}
		},
	}
}

const schema = buildSubgraphSchema({
	typeDefs: parse(Deno.readTextFileSync(`${path.dirname(path.fromFileUrl(import.meta.url))}/schema.graphql`)),
	resolvers,
})
const yoga = createYoga({
	schema
});

Deno.serve({
	hostname: "0.0.0.0",
	port: 3000,
}, yoga);