import schemaBuilder from "@pothos/core";
import directivesPlugin from "@pothos/plugin-directives";
import drizzlePlugin from "@pothos/plugin-drizzle";
import federationPlugin from "@pothos/plugin-federation";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { type GraphQLSchema } from "graphql";
import * as dataSchema from "../data-model/schema.ts";

export interface PothosTypes {
  DrizzleSchema: typeof dataSchema;
}

export const getSchema = (env: Env): GraphQLSchema => {
  const db = drizzle(env.DB, { schema: dataSchema });

  const builder = new schemaBuilder<PothosTypes>({
    plugins: [directivesPlugin, drizzlePlugin, federationPlugin],
    drizzle: {
      client: db,
      schema: dataSchema,
    },
  });

  const videoRef = builder.externalRef(
  "Video",
  builder.selection<{ id: string }>("id"),
).implement({
  externalFields: (t) => ({
    id: t.string(),
  }),
  fields: (t) => ({
    guests: t.field({
      type: [personRef],
      resolve: (video) =>
        db.select({
          id: dataSchema.videoGuestsTable.guestId,
        }).from(dataSchema.videoGuestsTable).where(
          eq(dataSchema.videoGuestsTable.videoId, video.id),
        ),
    }),
  }),
  });

  const personRef = builder.externalRef(
  "Person",
  builder.selection<{ id: string }>("id"),
).implement({
  externalFields: (t) => ({
    id: t.string(),
  }),
  fields: (t) => ({
    videos: t.field({
      type: [videoRef],
      resolve: (person) =>
        db.select({
          id: dataSchema.videoGuestsTable.videoId,
        }).from(dataSchema.videoGuestsTable).where(
          eq(dataSchema.videoGuestsTable.guestId, person.id),
        ),
    }),
    }),
  });

  return builder.toSubGraphSchema({
    linkUrl: "https://specs.apollo.dev/federation/v2.6",
    federationDirectives: ["@extends", "@external", "@key"],
  });
};
