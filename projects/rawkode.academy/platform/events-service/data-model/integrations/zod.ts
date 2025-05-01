import { eventsTable } from "../schema.ts";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const EventStatus = z.enum(["scheduled", "cancelled", "rescheduled"]);

export const CreateEvent = createInsertSchema(eventsTable, {
  id: z.string().min(1).max(255),
  type: z.enum(["event", "course", "workshop", "live-stream"]),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(255),
  startDate: z.date(),
  endDate: z.date(),
  attendeeLimit: z.number().int().positive().nullable(),
  url: z.string().url().nullable(),
  status: EventStatus,
  originalStartDate: z.date().nullable(),
  originalEndDate: z.date().nullable(),
  technologyIds: z.string().transform((val) => {
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        throw new Error("Must be a JSON array");
      }
      if (!parsed.every((id) => typeof id === "string")) {
        throw new Error("All IDs must be strings");
      }
      return val;
    } catch (_e) {
      throw new Error("Invalid JSON array of technology IDs");
    }
  }),
}).refine(
  (data) => {
    if (data.type === "live-stream" && !data.url) {
      return false;
    }
    if (data.type !== "live-stream" && data.url) {
      return false;
    }
    return true;
  },
  {
    message:
      "URL is required for live-stream events and can only be set for live-stream events",
    path: ["url"],
  },
).refine(
  (data) => {
    const now = new Date();
    const startDate = new Date(data.startDate);

    // Can't modify event after it has started
    if (now >= startDate) {
      return false;
    }

    // If rescheduling, original dates must be set
    if (
      data.status === "rescheduled" &&
      (!data.originalStartDate || !data.originalEndDate)
    ) {
      return false;
    }

    // If not rescheduled, original dates must be null
    if (
      data.status !== "rescheduled" &&
      (data.originalStartDate || data.originalEndDate)
    ) {
      return false;
    }

    return true;
  },
  {
    message:
      "Event cannot be modified after start date, and rescheduled events must have original dates set",
    path: ["status"],
  },
);
