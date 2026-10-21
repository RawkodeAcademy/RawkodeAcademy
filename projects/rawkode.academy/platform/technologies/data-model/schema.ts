import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type LearningResources = {
	official?: string[];
	community?: string[];
	tutorials?: string[];
};
export type Logos = { icon?: boolean; horizontal?: boolean; stacked?: boolean };

const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();

// A technology profile. The id is the public slug (e.g. "kubernetes");
// description is the profile body in Markdown. Transcription terms and video
// links live in the transcription-terms and video-technologies services.
// cncf, community, matrix and seo keep the content schema's shape
// (@rawkodeacademy/content technologyZod).
export const technologiesTable = sqliteTable("technologies", {
	id: text("id").notNull().primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description").notNull(),
	website: text("website"),
	documentation: text("documentation"),
	source: text("source"),
	license: text("license").notNull().default("Unknown"),
	status: text("status").notNull().default("stable"),
	category: text("category"),
	subcategory: text("subcategory"),
	aliases: json<string[]>("aliases"),
	relatedTechnologies: json<string[]>("related_technologies"),
	useCases: json<string[]>("use_cases"),
	features: json<string[]>("features"),
	learningResources: json<LearningResources>("learning_resources"),
	logos: json<Logos>("logos"),
	cncf: json<Record<string, unknown>>("cncf"),
	community: json<Record<string, string>>("community"),
	matrix: json<Record<string, string>>("matrix"),
	seo: json<{ title?: string; description?: string }>("seo"),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export type Technology = typeof technologiesTable.$inferSelect;
