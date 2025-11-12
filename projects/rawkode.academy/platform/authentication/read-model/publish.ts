import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { lexicographicSortSchema } from "graphql";
import { buildSchema } from "./schema";
import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const schemaAsString = printSchemaWithDirectives(
	lexicographicSortSchema(buildSchema()),
	{
		pathToDirectivesInExtensions: [""],
	},
);

const __dirname = dirname(fileURLToPath(import.meta.url));
writeFileSync(`${__dirname}/schema.gql`, schemaAsString);

console.log("✅ GraphQL schema published to schema.gql");
