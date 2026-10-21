import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// A person's biography in Markdown. People without one have no row.
export const peopleBiographies = sqliteTable("people_biographies", {
	personId: text("person_id").notNull().primaryKey(),
	biography: text("biography").notNull(),
});
