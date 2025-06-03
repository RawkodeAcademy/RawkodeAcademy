import type { Config } from "drizzle-kit";

export default ({
	schema: "./data-model/schema.ts",
	out: "./data-model/migrations",
	dialect: "sqlite",
	driver: "d1-http",
	breakpoints: true,
	strict: true,
	verbose: true,
} satisfies Config);
