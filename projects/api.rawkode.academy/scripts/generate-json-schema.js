import tsj from "ts-json-schema-generator";
import fs from "node:fs";

/** @type {import('ts-json-schema-generator/dist/src/Config').Config} */
const config = {
  path: "./schemata/*.ts",
  tsconfig: "./tsconfig.json",
  type: "*",
};

const output_path = "./dist/generated/json-schema";

const schema = tsj.createGenerator(config).createSchema(config.type);
const schemaString = JSON.stringify(schema, null, 2);
fs.writeFile(output_path, schemaString, (err) => {
  if (err) throw err;
});
