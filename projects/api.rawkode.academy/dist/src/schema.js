"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchema = void 0;
require("reflect-metadata");
const type_graphql_1 = require("type-graphql");
const resolver_1 = require("./yaml-data/resolver");
const person_1 = require("../schemata/person");
const getSchema = async () => await (0, type_graphql_1.buildSchema)({
    resolvers: [(0, resolver_1.createYamlResolver)("people", person_1.Person)],
    emitSchemaFile: {
        path: __dirname + "/../generated/schema.graphql",
        commentDescriptions: true,
        sortedSchema: false,
    },
});
exports.getSchema = getSchema;
