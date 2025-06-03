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

	if (libSqlUrl || libSqlBaseUrl) {
		const { createClient } = await import("@libsql/client");
		const { drizzle: libsqlDrizzle } = await import("drizzle-orm/libsql");
		
		const url = libSqlUrl || `https://${serviceName}-${libSqlBaseUrl}`;
		const client = createClient({ url, authToken });
		return libsqlDrizzle(client, { schema: dataSchema });
	}
	
	throw new Error("No database configuration found for local development");
};
