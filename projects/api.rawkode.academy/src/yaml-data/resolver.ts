import { Query, Resolver, ClassType } from "type-graphql";
import { loadTypeData } from "./loader";

export function createYamlResolver<T extends ClassType>(
  objectTypeCls: T,
  plural: string
) {
  @Resolver()
  abstract class YamlResolver {
    protected data: T[];

    constructor() {
      loadTypeData(this, plural).then((data) => (this.data = data));
    }

    @Query((type) => [objectTypeCls], { name: `getAll${plural}` })
    async getAll(): Promise<T[]> {
      return this.data;
    }
  }

  return YamlResolver;
}
