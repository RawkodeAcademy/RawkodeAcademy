import schemaBuilder from "@pothos/core";
import directivesPlugin from "@pothos/plugin-directives";
import drizzlePlugin from "@pothos/plugin-drizzle";
import federationPlugin from "@pothos/plugin-federation";
import { eq } from "drizzle-orm";
import { type GraphQLSchema } from "graphql";
import { db } from "../data-model/client.ts";
import * as dataSchema from "../data-model/schema.ts";

export interface PothosTypes {
  DrizzleSchema: typeof dataSchema;
}

// TODO: This should be shared across all services
interface Context {
  jwt: {
    payload: {
      sub: string;
      given_name: string;
      family_name: string;
      picture: string;
      email: string;
    };
  };
}

export interface PothosTypes {
  Context: Context;
  DrizzleSchema: typeof dataSchema;
}

export const getSchema = (): GraphQLSchema => {
  const builder = new schemaBuilder<PothosTypes>({
    plugins: [directivesPlugin, drizzlePlugin, federationPlugin],
    drizzle: {
      client: db,
    },
  });

  const technologyRef = builder.externalRef(
    "Technology",
    builder.selection<{ id: string }>("id"),
  );

  const eventsRef = builder.drizzleObject("eventsTable", {
    name: "Events",
    fields: (t) => ({
      id: t.exposeString("id"),
      type: t.exposeString("type"),
      title: t.exposeString("title"),
      description: t.exposeString("description"),
      startDate: t.exposeString("startDate"),
      endDate: t.exposeString("endDate"),
      attendeeLimit: t.exposeInt("attendeeLimit", { nullable: true }),
      url: t.exposeString("url", { nullable: true }),
      status: t.exposeString("status"),
      originalStartDate: t.exposeString("originalStartDate", {
        nullable: true,
      }),
      originalEndDate: t.exposeString("originalEndDate", { nullable: true }),
      technologies: t.field({
        type: [technologyRef],
        resolve: (event) => {
          const technologyIds = JSON.parse(event.technologyIds);
          return technologyIds.map((id: string) => ({ id }));
        },
      }),
    }),
  });

  builder.asEntity(eventsRef, {
    key: builder.selection<{ id: string }>("id"),
    resolveReference: async (user) =>
      await db.query.eventsTable.findFirst({
        where: eq(dataSchema.eventsTable.id, user.id),
      }).execute(),
  });

  builder.queryType({
    fields: (t) => ({
      me: t.drizzleField({
        type: eventsRef,
        resolve: async (query, _root, _args, ctx) =>
          await db.query.eventsTable.findFirst(query({
            where: eq(dataSchema.eventsTable.id, ctx.jwt.payload.sub),
          })).execute(),
      }),
    }),
  });

  return builder.toSubGraphSchema({
    linkUrl: "https://specs.apollo.dev/federation/v2.6",
    federationDirectives: ["@key", "@authenticated", "@requiresScopes"],
  });
};
