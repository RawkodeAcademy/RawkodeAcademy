import { db } from "./client.ts";
import { eventsTable } from "./schema.ts";

const seed = async () => {
  await db
    .insert(eventsTable)
    .values({
      type: "event",
      title: "Event 1",
      description: "Event 1 description",
      startDate: new Date(),
      endDate: new Date(),
    })
    .returning()
    .all();

  Deno.exit(0);
};

await seed();
