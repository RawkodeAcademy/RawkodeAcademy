import { createYoga } from "graphql-yoga";
import { drizzle } from "drizzle-orm/d1";
import { buildSchema } from "./schema";
import * as dataSchema from "../data-model/schema";

export interface Env {
	DB: D1Database;
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const db = drizzle(env.DB, { schema: dataSchema });
		
		const yoga = createYoga({
			schema: buildSchema(),
			context: { db },
			graphqlEndpoint: "/",
			landingPage: false,
		});
		
		return yoga.fetch(request, env, ctx);
	},
};
