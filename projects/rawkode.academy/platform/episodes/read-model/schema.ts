import schemaBuilder from '@pothos/core';
import directivesPlugin from '@pothos/plugin-directives';
import drizzlePlugin from '@pothos/plugin-drizzle';
import federationPlugin from '@pothos/plugin-federation';
import { eq } from 'drizzle-orm';
import { type GraphQLSchema } from 'graphql';
import { db } from '../data-model/client.ts';
import * as dataSchema from '../data-model/schema.ts';

export interface PothosTypes {
	DrizzleSchema: typeof dataSchema;
}

const builder = new schemaBuilder<PothosTypes>({
	plugins: [directivesPlugin, drizzlePlugin, federationPlugin],
	drizzle: {
		client: db,
	},
});

const showRef = builder.externalRef(
	'Show',
	builder.selection<{ id: string }>('id'),
);

const episodeRef = builder.externalRef(
	'Episode',
	builder.selection<{ id: string }>('id'),
).implement({
	externalFields: (t) => ({
		id: t.string(),
	}),
	fields: (t) => ({
		code: t.field({
			type: 'String',
			resolve: async (content) => {
				const result = await db.query.episodesTable.findFirst({
					columns: {
						code: true,
					},
					where: eq(dataSchema.episodesTable.contentId, content.id),
				});
				return result?.code ?? null;
			},
		}),
		show: t.field({
			type: showRef,
			resolve: async (content) => {
				const episode = await db.query.episodesTable.findFirst({
					columns: {
						showId: true,
					},
					where: eq(dataSchema.episodesTable.contentId, content.id),
				});

				if (!episode) {
					return null;
				}

				return { id: episode.showId };
			},
		}),
	}),
});

showRef.implement({
	externalFields: (t) => ({
		id: t.string(),
	}),
	fields: (t) => ({
		episodes: t.field({
			type: [episodeRef],
			resolve: (show) =>
				db.query.episodesTable.findMany({
					where: eq(dataSchema.episodesTable.showId, show.id),
				}).then((episodes) =>
					episodes.map((episode) => ({ id: episode.contentId }))
				),
		}),
	}),
});

export const getSchema = (): GraphQLSchema => {
	builder.asEntity(episodeRef, {
		key: builder.selection<{ id: string }>('id'),
		resolveReference: (episode) =>
			db.query.episodesTable.findFirst({
				where: eq(dataSchema.episodesTable.contentId, episode.id),
			}).then((result) => result ? { id: result.contentId } : null),
	});

	// builder.queryType({
	// 	fields: (t) => ({
	// 		episodeByShowCode: t.field({
	// 			type: episodeRef,
	// 			args: {
	// 				code: t.arg({
	// 					type: 'String',
	// 					required: true,
	// 				}),
	// 				showId: t.arg({
	// 					type: 'String',
	// 					required: true,
	// 				}),
	// 			},
	// 			resolve: (_root, args, _ctx) =>
	// 				db.query.episodesTable.findFirst({
	// 					where: and(
	// 						eq(dataSchema.episodesTable.showId, args.showId),
	// 						eq(dataSchema.episodesTable.code, args.code),
	// 					),
	// 				}).execute(),
	// 		}),
	// 		episodesForShow: t.field({
	// 			type: [episodeRef],
	// 			args: {
	// 				showId: t.arg({
	// 					type: 'String',
	// 					required: true,
	// 				}),
	// 			},
	// 			resolve: (_root, args, _ctx) =>
	// 				db.query.episodesTable.findMany({
	// 					where: eq(dataSchema.episodesTable.showId, args.showId),
	// 				}).execute(),
	// 		}),
	// 	}),
	// });

	return builder.toSubGraphSchema({
		linkUrl: 'https://specs.apollo.dev/federation/v2.6',
		federationDirectives: ['@extends', '@external', '@key'],
	});
};
