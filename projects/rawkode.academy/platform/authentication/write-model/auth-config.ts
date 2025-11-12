import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/d1";
import * as dataSchema from "../data-model/schema";

export interface Env {
	DB: D1Database;
	AUTH_SECRET: string;
	SITE_URL?: string;
}

export const createAuth = (env: Env) => {
	const db = drizzle(env.DB, { schema: dataSchema });
	
	return betterAuth({
		database: {
			// Better Auth will use these tables
			// We map them to our Drizzle schema
			provider: "sqlite",
			db: env.DB,
		},
		secret: env.AUTH_SECRET,
		baseURL: env.SITE_URL || "http://localhost:8787",
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
		},
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60, // 5 minutes
			},
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // 1 day (update session if it's older than this)
		},
		// Advanced options
		advanced: {
			generateId: () => {
				// Use CUID2 for ID generation
				return crypto.randomUUID();
			},
		},
	});
};
