import {
  type Context,
  endpoint,
  service,
  TerminalError,
} from "@restatedev/restate-sdk/fetch";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../data-model/client.ts";
import { CreateEvent } from "../data-model/integrations/zod.ts";
import { eventsTable } from "../data-model/schema.ts";

// This avoids using polyfilled node APIs
Deno.env.set("USE_WEB_CRYPTO", "true");

type T = z.infer<typeof CreateEvent>;

const eventService = service({
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

      ctx.console.log(
        "Checking unique constraints are passing before writing to database",
      );

      const checks = await db.select().from(eventTable).where(
        eq(eventTable.id, event.id),
      );

      if (checks.length > 0) {
        throw new TerminalError(
          `New event, ${event.id}, does not pass unique ID constraints.`,
          { errorCode: 400 },
        );
      }

      await db
        .insert(eventsTable)
        .values(event)
        .run();

      return "Job done";
    },
  },
});

const handler = endpoint().bind(eventService).withIdentityV1(
  Deno.env.get("RESTATE_IDENTITY_KEY") || "",
).bidirectional().handler();

Deno.serve(
  { port: parseInt(Deno.env.get("PORT") || "9080", 10) },
  handler.fetch,
);
