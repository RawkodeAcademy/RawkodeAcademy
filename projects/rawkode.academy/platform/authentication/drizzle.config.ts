import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./data-model/schema.ts",
	out: "./data-model/migrations",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
		databaseId: process.env.CLOUDFLARE_DATABASE_ID || "TBD",
		token: process.env.CLOUDFLARE_API_TOKEN!,
	},
});
