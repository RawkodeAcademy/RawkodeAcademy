import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type Podcast = {
	guid?: string;
	email: string;
	category: string;
	subcategory?: string;
	explicit: boolean;
	copyright?: string;
	artworkUrl?: string;
};
export type SubscribeLink = { platform: string; url: string; icon: string };

const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();

// A recurring show. The id is the public slug (e.g. "klustered"). Hosts,
// episodes and transcription terms live in the show-hosts, episodes and
// transcription-terms services.
export const showsTable = sqliteTable("shows", {
	id: text("id").notNull().primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	tagline: text("tagline"),
	status: text("status", { enum: ["coming-soon", "active", "archived"] })
		.notNull()
		.default("active"),
	published: integer("published", { mode: "boolean" }).notNull().default(false),
	gameFormatUrl: text("game_format_url"),
	coverUrl: text("cover_url"),
	coverAlt: text("cover_alt"),
	podcast: json<Podcast>("podcast"),
	subscribeLinks: json<SubscribeLink[]>("subscribe_links"),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export type Show = typeof showsTable.$inferSelect;
