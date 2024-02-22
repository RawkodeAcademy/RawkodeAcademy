import { relations, sql } from "drizzle-orm";
import { text, sqliteTable } from "drizzle-orm/sqlite-core";
import { showHostsTable } from "../shows";
import { readdirSync} from "fs";

export const peopleTable = sqliteTable("people", {
	id: text("id").notNull().primaryKey(),
	name: text("name").notNull(),
	biography: text("biography"),
	socialAccounts: text("social_accounts", { mode: "json" }).$type<{
		blueSky: string;
		discord: string;
		linkedin: string;
		mastodon: string;
		x: string;
		youtube: string;
	}>(),
	createdAt: text("created_at")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export type Person = typeof peopleTable.$inferSelect;
export type NewPerson = typeof peopleTable.$inferInsert;

export const peopleRelations = relations(peopleTable, ({ many }) => ({
	hosts: many(showHostsTable),
}));


export const loadPeople = async (): Promise<NewPerson[]> => {
	const files = await readdirSync(__dirname);
	return Promise.all(
		files
			.filter((file) => file.endsWith(".ts") && file !== "index.ts")
			.map(async (file) => {
				const module = await import(`./${file}`);
				return module.person as NewPerson;
			}),
	);
};
