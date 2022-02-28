import { default as fs } from "fs";
import { default as path } from "path";
import { GraphQLObjectType } from "graphql";
import { load } from "js-yaml";
import { readFile } from "fs/promises";
import { getSchema } from "../schema";

const dataDirectory = path.resolve(__dirname, "../../../../data");

export async function loadTypeData<Type>(
  type: Type,
  name: string
): Promise<Type[]> {
  var data: Type[] = [];

  const schema = await getSchema();

  const schemaType = schema.getType(name) as GraphQLObjectType;
  const directoryPath = dataDirectory + "/" + schemaType.extensions.plural;

  console.log(`Checking for data in ${directoryPath}`);

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }

    files.forEach(async function (file) {
      const filepath = path.join(directoryPath, file);
      const yaml = load(await readFile(filepath, "utf8")) as Type;
      data.push(yaml);
    });
  });

  return data;
}
