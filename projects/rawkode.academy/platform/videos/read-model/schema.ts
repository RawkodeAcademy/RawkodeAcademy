import schemaBuilder from '@pothos/core';
import directivesPlugin from '@pothos/plugin-directives';
import federationPlugin from '@pothos/plugin-federation';
import { type GraphQLSchema } from 'graphql';
import { DateResolver } from 'graphql-scalars';

export interface PothosTypes {
	Scalars: {
		Date: {
			Input: Date;
			Output: Date;
		};
	};
}

const builder = new schemaBuilder<PothosTypes>({
	plugins: [directivesPlugin, federationPlugin],
});

builder.addScalarType('Date', DateResolver);

builder.externalRef(
	'Video',
	builder.selection<{ id: string }>('id'),
).implement({
	externalFields: (t) => ({
		id: t.string(),
	}),
	fields: (t) => ({
		playlistUrl: t.string({
			resolve: (video) =>
				`https://videos.rawkode.academy/${video.id}/stream.m3u8`,
		}),
		thumbnailUrl: t.string({
			resolve: (video) =>
				`https://videos.rawkode.academy/${video.id}/thumbnail.jpg`,
		}),
	}),
});

builder.externalRef(
	'Episode',
	builder.selection<{ id: string }>('id'),
).implement({
	externalFields: (t) => ({
		id: t.string(),
	}),
	fields: (t) => ({
		playlistUrl: t.string({
			resolve: (video) =>
				`https://videos.rawkode.academy/${video.id}/stream.m3u8`,
		}),
		thumbnailUrl: t.string({
			resolve: (video) =>
				`https://videos.rawkode.academy/${video.id}/thumbnail.jpg`,
		}),
	}),
});

export const getSchema = (): GraphQLSchema =>
	builder.toSubGraphSchema({
		linkUrl: 'https://specs.apollo.dev/federation/v2.6',
		federationDirectives: ['@extends', '@external', '@key'],
	});
