"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const apollo_server_1 = require("apollo-server");
const schema_1 = require("./schema");
async function bootstrap() {
    const server = new apollo_server_1.ApolloServer({
        schema: await (0, schema_1.getSchema)(),
    });
    const { url } = await server.listen(4000);
    console.log(`Server is running, GraphQL Playground available at ${url}`);
}
bootstrap();
