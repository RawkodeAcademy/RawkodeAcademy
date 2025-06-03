import { drizzle } from "drizzle-orm/d1";
import * as dataSchema from "./schema";

export interface Env {
	D1_DATABASE: any;
}

export const createDb = (env: Env) => {
	return drizzle(env.D1_DATABASE, { schema: dataSchema });
};

export const getLocalDb = async () => {
	const serviceName = process.env.SERVICE_NAME;
	const libSqlUrl = process.env.LIBSQL_URL;
	const libSqlBaseUrl = process.env.LIBSQL_BASE_URL;
	const authToken = process.env.LIBSQL_TOKEN || "";

	if (process.env.NODE_ENV === "test") {
		const Database = await import("better-sqlite3");
		const { drizzle: sqliteDrizzle } = await import("drizzle-orm/better-sqlite3");
		const sqlite = new Database.default(":memory:");
		const db = sqliteDrizzle(sqlite, { schema: dataSchema });
		
		sqlite.exec(`
			CREATE TABLE IF NOT EXISTS events (
				id TEXT PRIMARY KEY NOT NULL,
				title TEXT NOT NULL,
				description TEXT NOT NULL,
				start_date INTEGER NOT NULL,
				end_date INTEGER NOT NULL,
				created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
			)
		`);
		
		return db;
	}

	if (libSqlUrl || libSqlBaseUrl) {
		try {
			const { createClient } = await import("@libsql/client");
			const { drizzle: libsqlDrizzle } = await import("drizzle-orm/libsql");
			
			const url = libSqlUrl || `https://${serviceName}-${libSqlBaseUrl}`;
			const client = createClient({ url, authToken });
			return libsqlDrizzle(client, { schema: dataSchema });
		} catch (error) {
			console.warn("LibSQL connection failed, falling back to in-memory SQLite:", error);
		}
	}
	
	const Database = await import("better-sqlite3");
	const { drizzle: sqliteDrizzle } = await import("drizzle-orm/better-sqlite3");
	const sqlite = new Database.default(":memory:");
	const db = sqliteDrizzle(sqlite, { schema: dataSchema });
	
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS events (
			id TEXT PRIMARY KEY NOT NULL,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			start_date INTEGER NOT NULL,
			end_date INTEGER NOT NULL,
			created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
		)
	`);
	
	return db;
};
