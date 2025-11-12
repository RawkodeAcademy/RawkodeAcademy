import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

// Users table - core user identity
export const usersTable = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	name: text("name"),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Sessions table - user sessions
export const sessionsTable = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Accounts table - authentication providers (email/password, OAuth, etc.)
export const accountsTable = sqliteTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		provider: text("provider").notNull(), // "email", "google", "github", etc.
		providerAccountId: text("provider_account_id").notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		expiresAt: integer("expires_at", { mode: "timestamp" }),
		tokenType: text("token_type"),
		scope: text("scope"),
		idToken: text("id_token"),
		passwordHash: text("password_hash"), // for email/password provider
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	},
	(table) => ({
		providerKey: primaryKey({
			columns: [table.provider, table.providerAccountId],
		}),
	}),
);

// Verification tokens table - for email verification and password reset
export const verificationTokensTable = sqliteTable(
	"verification_tokens",
	{
		identifier: text("identifier").notNull(), // email or user id
		token: text("token").notNull().unique(),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		type: text("type").notNull(), // "email_verification", "password_reset"
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(table) => ({
		identifierTokenKey: primaryKey({
			columns: [table.identifier, table.token],
		}),
	}),
);
