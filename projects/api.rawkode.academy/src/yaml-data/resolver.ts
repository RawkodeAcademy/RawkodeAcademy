import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import { Query, Resolver, ClassType } from "type-graphql";
import { readdir } from "node:fs";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDirectory = resolve(__dirname, "../../../../../data");

export function createYamlResolver<T extends ClassType>(
  objectTypeCls: T,
  name: string,
  plural: string
) {
  @Resolver()
  class YamlResolver {
    protected typeName: string;
    protected typePlural: string;
    protected dataPath: string;
    protected data: T[];
    protected initialized: boolean;

    protected constructor() {
      this.initialized = false;

      this.typeName = name.toLowerCase();
      this.typePlural = plural.toLowerCase();
      this.dataPath = dataDirectory + "/" + this.typePlural;
    }

    protected async loadData(): Promise<T[]> {
      const data: T[] = [];
      const dataPath = this.dataPath;

      const awaitReaddir = promisify(readdir);
      const files = await awaitReaddir(dataPath);

      for (const file of files) {
        const filepath = join(dataPath, file);
        const yaml: T = load(await readFile(filepath, "utf8")) as T;
        // yaml.id = file.replace(".yaml", "");

        data.push(yaml);
      }

      this.data = data;
      this.initialized = true;

      console.log(`Loaded`);
      console.log(data);

      return data;
    }

    @Query((type) => [objectTypeCls], { name: `get${plural}` })
    public async getAll(): Promise<T[]> {
      if (this.initialized === false) {
        return await this.loadData();
      }

      return this.data;
    }
  }

  return YamlResolver;
}
