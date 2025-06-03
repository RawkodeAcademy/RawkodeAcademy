import { eventsTable } from "../schema.ts";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const CreateEvent = createInsertSchema(eventsTable, {
  id: z.never().optional(),
  createdAt: z.never().optional(),
  updatedAt: z.never().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
});
