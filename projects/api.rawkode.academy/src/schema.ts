import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { createYamlResolver } from "./yaml-data/resolver.js";
import { Person } from "../schemata/person.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getSchema = async () =>
  await buildSchema({
    resolvers: [createYamlResolver(Person, "Person", "People")],
    emitSchemaFile: {
      path: __dirname + "/../generated/schema.graphql",
      commentDescriptions: true,
      sortedSchema: false,
    },
  });
