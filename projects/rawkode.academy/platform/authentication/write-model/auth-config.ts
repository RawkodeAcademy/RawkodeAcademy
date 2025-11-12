import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins";
import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
	DB: D1Database;
	AUTH_SECRET: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
	SITE_URL?: string;
}

export const createAuth = (env: Env) => {
	return betterAuth({
		database: {
			provider: "sqlite",
			db: env.DB,
		},
		secret: env.AUTH_SECRET,
		baseURL: env.SITE_URL || "https://rawkode.academy",
		
		// Social providers - GitHub only
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
		},
		
		// Passkey/WebAuthn plugin
		plugins: [
			passkey({
				rpName: "Rawkode Academy",
				rpID: env.SITE_URL ? new URL(env.SITE_URL).hostname : "rawkode.academy",
			}),
		],
		
		// Session configuration
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60, // 5 minutes
			},
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // 1 day
		},
		
		// Advanced options
		advanced: {
			generateId: () => crypto.randomUUID(),
			crossSubDomainCookies: {
				enabled: true,
			},
		},
	});
};
