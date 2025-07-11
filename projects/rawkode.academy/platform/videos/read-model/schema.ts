import schemaBuilder from "@pothos/core";
import directivesPlugin from "@pothos/plugin-directives";
import drizzlePlugin from "@pothos/plugin-drizzle";
import federationPlugin from "@pothos/plugin-federation";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, like, lte, or, sql } from "drizzle-orm";
import type { GraphQLSchema } from "graphql";
import { DateResolver } from "graphql-scalars";
import * as dataSchema from "../data-model/schema.ts";

export interface PothosTypes {
  DrizzleSchema: typeof dataSchema;
  Scalars: {
    Date: {
      Input: Date;
      Output: Date;
    };
  };
}

export const getSchema = (env: Env): GraphQLSchema => {
  const db = drizzle(env.DB, {
    schema: dataSchema,
    logger: {
      logQuery: (query, params) => {
        console.log('SQL Query:', query);
        console.log('Parameters count:', params.length);
        console.log('Parameters:', params);
      }
    }
  });

  const builder = new schemaBuilder<PothosTypes>({
    plugins: [directivesPlugin, drizzlePlugin, federationPlugin],
    drizzle: {
      client: db,
      schema: dataSchema,
    },
  });

  builder.addScalarType("Date", DateResolver);

  const videoRef = builder.objectRef<typeof dataSchema.videosTable.$inferSelect>("Video");

  builder.objectType(videoRef, {
    fields: (t) => ({
      id: t.exposeString("id"),
      title: t.exposeString("title"),
      subtitle: t.exposeString("subtitle"),
      slug: t.exposeString("slug"),
      description: t.exposeString("description"),
      publishedAt: t.field({
        type: "Date",
        resolve: (video) => video.publishedAt,
      }),
      duration: t.exposeInt("duration"),
      streamUrl: t.string({
        resolve: (video) =>
          `https://content.rawkode.academy/videos/${video.id}/stream.m3u8`,
      }),
      thumbnailUrl: t.string({
        resolve: (video) =>
          `https://content.rawkode.academy/videos/${video.id}/thumbnail.jpg`,
      }),
    }),
  });

  builder.asEntity(videoRef, {
    key: builder.selection<{ id: string }>("id"),
    resolveReference: async (video) => {
      const result = await db
        .select()
        .from(dataSchema.videosTable)
        .where(eq(dataSchema.videosTable.id, video.id))
        .get();
      return result;
    },
  });

  builder.queryType({
    fields: (t) => ({
      videoByID: t.field({
        type: videoRef,
        args: {
          id: t.arg({
            type: "String",
            required: true,
          }),
        },
        resolve: (_root, args, _ctx) =>
          db.query.videosTable
            .findFirst({
              where: eq(dataSchema.videosTable.id, args.id),
            })
            .execute(),
      }),
      getAllVideos: t.field({
        type: [videoRef],
        resolve: (_root, _args, _ctx) => {
          const now = new Date();
          return db
            .select()
            .from(dataSchema.videosTable)
            .where(lte(dataSchema.videosTable.publishedAt, now))
            .orderBy(desc(dataSchema.videosTable.publishedAt));
        },
      }),
      getLatestVideos: t.field({
        type: [videoRef],
        args: {
          limit: t.arg({
            type: "Int",
            required: false,
          }),
          offset: t.arg({
            type: "Int",
            required: false,
          }),
        },
        resolve: (_root, args, _ctx) => {
          const now = new Date();
          return db
            .select()
            .from(dataSchema.videosTable)
            .where(lte(dataSchema.videosTable.publishedAt, now))
            .orderBy(desc(dataSchema.videosTable.publishedAt))
            .limit(args.limit ?? 15)
            .offset(args.offset ?? 0);
        },
      }),
      getRandomVideos: t.field({
        type: [videoRef],
        args: {
          limit: t.arg({
            type: "Int",
            required: false,
          }),
        },
        resolve: (_root, args, _ctx) =>
          db
            .select()
            .from(dataSchema.videosTable)
            .orderBy(desc(sql`RANDOM()`))
            .limit(args.limit ?? 15),
      }),
      simpleSearch: t.field({
        type: [videoRef],
        args: {
          term: t.arg({
            type: "String",
            required: true,
          }),
          limit: t.arg({
            type: "Int",
            required: false,
          }),
        },
        resolve: (_root, args, _ctx) => {
          const term = `%${args.term}%`;
          const now = new Date();

          return db.query.videosTable
            .findMany({
              limit: args.limit ?? 15,
              where: and(
                lte(dataSchema.videosTable.publishedAt, now),
                or(
                  like(dataSchema.videosTable.title, term),
                  like(dataSchema.videosTable.description, term),
                ),
              ),
              orderBy: (video, { desc }) => desc(video.publishedAt),
            })
            .execute();
        },
      }),
    }),
  });

  return builder.toSubGraphSchema({
    linkUrl: "https://specs.apollo.dev/federation/v2.6",
    federationDirectives: ["@extends", "@external", "@key"],
  });
};
