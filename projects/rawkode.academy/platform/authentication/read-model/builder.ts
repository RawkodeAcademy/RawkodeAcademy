import SchemaBuilder from "@pothos/core";
import FederationPlugin from "@pothos/plugin-federation";
import DirectivesPlugin from "@pothos/plugin-directives";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import type * as dataSchema from "../data-model/schema";
import type { drizzle } from "drizzle-orm/d1";

export interface PothosTypes {
	DrizzleSchema: typeof dataSchema;
	Context: {
		db: ReturnType<typeof drizzle<typeof dataSchema>>;
	};
}

export const createPothosBuilder = () => {
	return new SchemaBuilder<PothosTypes>({
		plugins: [DirectivesPlugin, FederationPlugin, DrizzlePlugin],
		drizzle: {
			client: (ctx) => ctx.db,
		},
	});
};
