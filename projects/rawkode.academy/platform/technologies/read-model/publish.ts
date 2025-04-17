import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { lexicographicSortSchema } from "graphql";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getSchema } from "./schema";

const schemaAsString = printSchemaWithDirectives(
	lexicographicSortSchema(getSchema()),
	{
		// This is needed to print the directives properly,
		// no idea why.
		pathToDirectivesInExtensions: [""],
	},
);

const outputPath = join(import.meta.dirname, "schema.gql");

writeFileSync(outputPath, schemaAsString);
