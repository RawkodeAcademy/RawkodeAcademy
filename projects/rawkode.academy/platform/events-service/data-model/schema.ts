import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const eventsTable = sqliteTable("events", {
  id: text("id").notNull().$defaultFn(createId).primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  attendeeLimit: integer("attendee_limit"),
  url: text("url"),
  status: text("status").notNull().default("scheduled"),
  originalStartDate: text("original_start_date"),
  originalEndDate: text("original_end_date"),
  technologyIds: text("technology_ids").notNull().default("[]"),
});
