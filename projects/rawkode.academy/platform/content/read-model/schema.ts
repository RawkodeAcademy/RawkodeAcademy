import schemaBuilder from '@pothos/core';
import directivesPlugin from '@pothos/plugin-directives';
import drizzlePlugin from '@pothos/plugin-drizzle';
import federationPlugin from '@pothos/plugin-federation';
import { eq, lte } from 'drizzle-orm';
import { type GraphQLSchema } from 'graphql';
import { DateResolver } from 'graphql-scalars';
import { db } from '../data-model/client.ts';
import * as dataSchema from '../data-model/schema.ts';

export interface PothosTypes {
	DrizzleSchema: typeof dataSchema;
	Scalars: {
		Date: {
			Input: Date;
			Output: Date;
		};
	};
}

const builder = new schemaBuilder<PothosTypes>({
	plugins: [directivesPlugin, drizzlePlugin, federationPlugin],
	drizzle: {
		client: db,
	},
});

builder.addScalarType('Date', DateResolver);

interface Content {
	id: string;
	contentType: string;
	title: string;
	subtitle: string;
	description: string;
	publishedAt: Date;
}

const contentRef = builder.interfaceRef<Content>('Content');

builder.objectRef<Content>('Episode').implement({
	interfaces: [contentRef],
	isTypeOf: (content: unknown) =>
		(content as Content).contentType === 'episode',
});

builder.objectRef<Content>('Video').implement({
	interfaces: [contentRef],
	isTypeOf: (content: unknown) => (content as Content).contentType === 'video',
});

contentRef.implement({
	fields: (t) => ({
		id: t.exposeString('id'),
		title: t.exposeString('title'),
		subtitle: t.exposeString('subtitle'),
		description: t.exposeString('description'),
		publishedAt: t.field({
			type: 'Date',
			resolve: (content) => content.publishedAt,
		}),
	}),
});

builder.queryType({
	fields: (t) => ({
		contentByID: t.field({
			type: contentRef,
			args: {
				id: t.arg({
					type: 'String',
					required: true,
				}),
			},
			resolve: (_root, args, _ctx) =>
				db.query.contentTable.findFirst({
					where: eq(dataSchema.contentTable.id, args.id),
				}).execute(),
		}),
		getLatestContent: t.field({
			type: [contentRef],
			args: {
				limit: t.arg({
					type: 'Int',
					required: false,
				}),
				offset: t.arg({
					type: 'Int',
					required: false,
				}),
			},
			resolve: (_root, args, _ctx) =>
				db.query.contentTable.findMany({
					limit: args.limit ?? 15,
					offset: args.offset ?? 0,
					where: lte(dataSchema.contentTable.publishedAt, new Date()),
					orderBy: (video, { desc }) => desc(video.publishedAt),
				}).execute(),
		}),
	}),
});

export const getSchema = (): GraphQLSchema =>
	builder.toSubGraphSchema({
		linkUrl: 'https://specs.apollo.dev/federation/v2.6',
		federationDirectives: ['@key'],
	});
