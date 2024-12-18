import { createId } from '@paralleldrive/cuid2';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const contentTable = sqliteTable('content', {
	id: text('id').primaryKey().$default(createId),
	contentType: text('content_type').notNull(),
	publishedAt: integer({ mode: 'timestamp' }).notNull(),

	title: text('title').notNull(),
	subtitle: text('subtitle').notNull(),
	description: text('description').notNull(),
});
