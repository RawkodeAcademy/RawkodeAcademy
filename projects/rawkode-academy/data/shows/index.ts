import { relations, sql } from "drizzle-orm";
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { peopleTable } from "../people";
import { readdirSync } from "fs";

const plural = "shows";

export const showsTable = sqliteTable(plural, {
	id: text("id").notNull().primaryKey(),
	name: text("name").notNull(),
	createdAt: text("created_at")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export type Show = typeof showsTable.$inferSelect;
export type NewShow = typeof showsTable.$inferInsert;

export const showHostsTable = sqliteTable(
	"show_hosts",
	{
		showId: text("show_id")
			.notNull()
			.references(() => showsTable.id),
		personId: text("person_id")
			.notNull()
			.references(() => peopleTable.id),
	},
	(t) => ({
		pk: primaryKey({
			columns: [t.showId, t.personId],
		}),
	}),
);

export const showRelations = relations(showsTable, ({ many }) => ({
	hosts: many(showHostsTable),
}));

export const showHostsRelations = relations(showHostsTable, ({ one }) => ({
	show: one(showsTable, {
		fields: [showHostsTable.showId],
		references: [showsTable.id],
	}),
	person: one(peopleTable, {
		fields: [showHostsTable.personId],
		references: [peopleTable.id],
	}),
}));

export type ShowHost = typeof showHostsTable.$inferSelect;
export type NewShowHost = typeof showHostsTable.$inferInsert;

interface Returns {
	shows: NewShow[];
	showHosts: NewShowHost[];
}

export const loadShows = async (): Promise<Returns> => {
	const files = await readdirSync(__dirname);

	let returns: Returns = {
		shows: [],
		showHosts: [],
	};

	await Promise.all(
		files
			.filter((file) => file.endsWith(".ts") && file !== "index.ts")
			.map(async (file) => {
				const module = await import(`./${file}`) as {
					show: NewShow;
					showHosts: NewShowHost[];
				};

				returns.shows.push(module.show);
				returns.showHosts.push(...module.showHosts);
			})
	);
	return returns;
};
