import { createYoga } from "graphql-yoga";
import { getSchema } from "./schema";

export interface Env {
	D1_DATABASE: any;
}

export default {
	fetch: (request: Request, env: Env, ctx: any) => {
		const yoga = createYoga({
			schema: getSchema(env),
			graphqlEndpoint: "/",
		});
		
		return yoga.fetch(request, env, ctx);
	},
};
