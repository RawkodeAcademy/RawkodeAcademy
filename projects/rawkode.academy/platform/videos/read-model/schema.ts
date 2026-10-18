import type { D1Database } from "@cloudflare/workers-types";
import schemaBuilder from "@pothos/core";
import directivesPlugin from "@pothos/plugin-directives";
import federationPlugin from "@pothos/plugin-federation";
import { and, asc, desc, eq, gt, lte, or, type SQLWrapper, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { GraphQLSchema } from "graphql";
import { DateResolver } from "graphql-scalars";
import * as s from "../data-model/schema";

type Video = s.Video;

export interface PothosTypes {
	Context: Record<string, unknown>;
	Scalars: { Date: { Input: Date; Output: Date } };
}

const cdn = "https://content.rawkode.academy/videos";

export const getSchema = (
	env: { DB: D1Database },
	now: () => Date = () => new Date(),
): GraphQLSchema => {
	const db = drizzle(env.DB, { schema: s });
	const builder = new schemaBuilder<PothosTypes>({
		plugins: [directivesPlugin, federationPlugin],
	});
	builder.addScalarType("Date", DateResolver);

	const v = s.videosTable;
	const published = () => lte(v.publishedAt, now());
	const byId = (id: string) => db.select().from(v).where(eq(v.id, id)).get();

	const VideoTypeEnum = builder.enumType("VideoType", {
		values: ["live", "recorded"] as const,
	});
	const VideoCategoryEnum = builder.enumType("VideoCategory", {
		values: [
			"editorial",
			"tutorial",
			"review",
			"interview",
			"announcement",
		] as const,
	});

	const VideoRef = builder.objectRef<Video>("Video");
	builder.objectType(VideoRef, {
		fields: (t) => ({
			id: t.exposeString("id"),
			title: t.exposeString("title"),
			subtitle: t.string({ nullable: true, resolve: (r) => r.subtitle }),
			tagline: t.string({ nullable: true, resolve: (r) => r.tagline }),
			slug: t.exposeString("slug"),
			description: t.exposeString("description"),
			whatYouWillLearn: t.stringList({
				resolve: (r) => r.whatYouWillLearn ?? [],
			}),
			publishedAt: t.field({ type: "Date", resolve: (r) => r.publishedAt }),
			duration: t.int({ nullable: true, resolve: (r) => r.duration }),
			type: t.field({
				type: VideoTypeEnum,
				nullable: true,
				resolve: (r) => r.type,
			}),
			category: t.field({
				type: VideoCategoryEnum,
				nullable: true,
				resolve: (r) => r.category,
			}),
			youtubeId: t.string({ nullable: true, resolve: (r) => r.youtubeId }),
			streamUrl: t.string({
				resolve: (r) => `${cdn}/${r.id}/stream.m3u8`,
			}),
			thumbnailUrl: t.string({
				resolve: (r) => `${cdn}/${r.id}/thumbnail.webp`,
			}),
		}),
	});

	builder.asEntity(VideoRef, {
		key: builder.selection<{ id: string }>("id"),
		resolveReference: (ref) => byId(ref.id),
	});

	builder.queryType({
		fields: (t) => ({
			videoByID: t.field({
				type: VideoRef,
				nullable: true,
				args: { id: t.arg.string({ required: true }) },
				resolve: (_root, args) => byId(args.id),
			}),
			videoBySlug: t.field({
				type: VideoRef,
				nullable: true,
				args: { slug: t.arg.string({ required: true }) },
				resolve: (_root, args) =>
					db.select().from(v).where(eq(v.slug, args.slug)).get(),
			}),
			// Every video, upcoming streams included.
			getAllVideos: t.field({
				type: [VideoRef],
				resolve: () => db.select().from(v).orderBy(desc(v.publishedAt)).all(),
			}),
			getLatestVideos: t.field({
				type: [VideoRef],
				args: {
					limit: t.arg.int({ defaultValue: 15 }),
					offset: t.arg.int({ defaultValue: 0 }),
				},
				resolve: (_root, args) =>
					db
						.select()
						.from(v)
						.where(published())
						.orderBy(desc(v.publishedAt))
						.limit(args.limit ?? 15)
						.offset(args.offset ?? 0)
						.all(),
			}),
			getUpcomingVideos: t.field({
				type: [VideoRef],
				args: {
					limit: t.arg.int({ defaultValue: 15 }),
					offset: t.arg.int({ defaultValue: 0 }),
				},
				resolve: (_root, args) =>
					db
						.select()
						.from(v)
						.where(and(eq(v.type, "live"), gt(v.publishedAt, now())))
						.orderBy(asc(v.publishedAt))
						.limit(args.limit ?? 15)
						.offset(args.offset ?? 0)
						.all(),
			}),
			getRandomVideos: t.field({
				type: [VideoRef],
				args: { limit: t.arg.int({ defaultValue: 5 }) },
				resolve: (_root, args) =>
					db
						.select()
						.from(v)
						.where(published())
						.orderBy(sql`random()`)
						.limit(args.limit ?? 5)
						.all(),
			}),
			simpleSearch: t.field({
				type: [VideoRef],
				args: {
					term: t.arg.string({ required: true }),
					limit: t.arg.int({ defaultValue: 15 }),
				},
				resolve: (_root, args) => {
					// SQLite LIKE is case-insensitive for ASCII, matching the old
					// lower-cased substring search.
					const term = `%${args.term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
					const match = (column: SQLWrapper) =>
						sql`${column} like ${term} escape '\\'`;
					return db
						.select()
						.from(v)
						.where(
							and(published(), or(match(v.title), match(v.description), match(v.subtitle))),
						)
						.orderBy(desc(v.publishedAt))
						.limit(args.limit ?? 15)
						.all();
				},
			}),
		}),
	});

	return builder.toSubGraphSchema({
		linkUrl: "https://specs.apollo.dev/federation/v2.6",
		federationDirectives: ["@key"],
	});
};
