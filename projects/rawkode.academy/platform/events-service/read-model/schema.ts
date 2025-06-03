import schemaBuilder from '@pothos/core';
import directivesPlugin from '@pothos/plugin-directives';
import drizzlePlugin from '@pothos/plugin-drizzle';
import federationPlugin from '@pothos/plugin-federation';
import { eq, gte } from 'drizzle-orm';
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

export const getSchema = (): GraphQLSchema => {
	const eventRef = builder.drizzleObject('eventsTable', {
		name: 'Event',
		fields: (t) => ({
			id: t.exposeString('id'),
			title: t.exposeString('title'),
			description: t.exposeString('description'),
			startDate: t.field({
				type: 'Date',
				resolve: (event) => event.startDate,
			}),
			endDate: t.field({
				type: 'Date',
				resolve: (event) => event.endDate,
			}),
			createdAt: t.field({
				type: 'Date',
				resolve: (event) => event.createdAt,
			}),
			updatedAt: t.field({
				type: 'Date',
				resolve: (event) => event.updatedAt,
			}),
		}),
	});

	builder.asEntity(eventRef, {
		key: builder.selection<{ id: string }>('id'),
		resolveReference: (event) =>
			db.query.eventsTable.findFirst({
				where: eq(dataSchema.eventsTable.id, event.id),
			}).execute(),
	});

	builder.queryType({
		fields: (t) => ({
			eventById: t.drizzleField({
				type: eventRef,
				args: {
					id: t.arg({
						type: 'String',
						required: true,
					}),
				},
				resolve: (query, _root, args, _ctx) =>
					db.query.eventsTable.findFirst(query({
						where: eq(dataSchema.eventsTable.id, args.id),
					})).execute(),
			}),
			allEvents: t.drizzleField({
				type: [eventRef],
				resolve: (query, _root, _args, _ctx) =>
					db.query.eventsTable.findMany(query()).execute(),
			}),
			upcomingEvents: t.drizzleField({
				type: [eventRef],
				args: {
					limit: t.arg({
						type: 'Int',
						required: false,
					}),
				},
				resolve: (query, _root, args, _ctx) =>
					db.query.eventsTable.findMany(query({
						where: gte(dataSchema.eventsTable.startDate, new Date()),
						orderBy: (event, { asc }) => asc(event.startDate),
						limit: args.limit ?? 10,
					})).execute(),
			}),
		}),
	});

	return builder.toSubGraphSchema({
		linkUrl: 'https://specs.apollo.dev/federation/v2.6',
		federationDirectives: ['@key'],
	});
};
