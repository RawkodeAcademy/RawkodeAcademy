import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

/**
 * Why don't episodes have a date?
 *
 * I was going to include this, but
 * as each episode could be delivered as multiple
 * assets: video, audio, podcast, interview, whatever
 * Those should determine publish date
 * As such, when you visit the episode page, you'll
 * see all the assets available for that episode.
 * and if none have been published yet, we can display
 * the times they are scheduled to be published.
 */
export const episodesTable = sqliteTable('episodes', {
	contentId: text('contentId').notNull().primaryKey(),
	showId: text('showId').notNull(),
	code: text('code').notNull(), // RESTATE1, K8S1, etc.
}, (table) => (
	{
		episodecode: unique().on(table.showId, table.code),
	}
));
