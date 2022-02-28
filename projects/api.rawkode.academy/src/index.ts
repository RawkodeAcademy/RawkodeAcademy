import "reflect-metadata";
import { ApolloServer } from "apollo-server";
import { getSchema } from "./schema.js";

async function bootstrap() {
  const server = new ApolloServer({
    schema: await getSchema(),
  });

  const { url } = await server.listen(4000);
  console.log(`Server is running, GraphQL Playground available at ${url}`);
}

bootstrap();
