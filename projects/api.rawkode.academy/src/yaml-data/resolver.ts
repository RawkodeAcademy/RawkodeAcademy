import { default as fs } from "fs";
import { default as path } from "path";
import { getSchema } from "../schema";
import { GraphQLObjectType } from "graphql";
import { load } from "js-yaml";
import { Query, Resolver, ClassType } from "type-graphql";
import { readFile } from "fs/promises";

const dataDirectory = path.resolve(__dirname, "../../../../../data");

export function createYamlResolver<T extends ClassType>(
  objectTypeCls: T,
  name: string,
  plural: string
) {
  @Resolver()
  abstract class YamlResolver {
    protected data: T[];

    constructor() {
      this.loadData().then((data) => (this.data = data));
    }

    async loadData() {
      const data: T[] = [];

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
          const yaml = load(await readFile(filepath, "utf8")) as T;
          // yaml.id = file.replace(".yaml", "");

          data.push(yaml);
        });
      });

      return data;
    }

    @Query((type) => [objectTypeCls], { name: `getAll${plural}` })
    async getAll(): Promise<T[]> {
      await this.loadData();

      return this.data;
    }
  }

  return YamlResolver;
}
