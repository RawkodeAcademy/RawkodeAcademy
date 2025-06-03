import { createClient } from "@libsql/client";
import {
	type Context,
	endpoint,
	service,
	TerminalError,
} from "@restatedev/restate-sdk/fetch";
import slugify from "@sindresorhus/slugify";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { z } from "zod";
import { CreateEvent } from "../data-model/integrations/zod.ts";
import { eventsTable } from "../data-model/schema.ts";

Deno.env.set("USE_WEB_CRYPTO", "true");

type T = z.infer<typeof CreateEvent>;

const eventsService = service({
	name: "event",
	handlers: {
		create: async (ctx: Context, event: T) => {
			try {
				CreateEvent.parse(event);
			} catch (e) {
				return {
					message: "Failed to create event.",
					error: e,
				};
			}

			const client = createClient({
				url: Deno.env.get("LIBSQL_URL") || "",
				authToken: Deno.env.get("LIBSQL_TOKEN") || "",
			});

			const id = slugify(event.title, {
				lowercase: true,
			});

			const db = drizzle(client);

			ctx.console.log(
				"Checking unique constraints are passing before writing to database",
			);

			const checks = await db.select().from(eventsTable).where(
				eq(eventsTable.id, id),
			);

			if (checks.length > 0) {
				throw new TerminalError(
					`New event, ${event.title}, does not pass unique ID constraints. ID was generated as ${id}.`,
					{ errorCode: 400 },
				);
			}

			await db
				.insert(eventsTable)
				.values({
					...event,
					id,
				})
				.run();

			return "Job done";
		},
	},
});

const handler = endpoint().bind(eventsService).withIdentityV1(
	Deno.env.get("RESTATE_IDENTITY_KEY") || "",
).bidirectional().handler();

Deno.serve({ port: parseInt(Deno.env.get("PORT") || "9080", 10) }, handler.fetch);
