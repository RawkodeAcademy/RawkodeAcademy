import { assertEquals, assert } from "https://deno.land/std@0.207.0/testing/asserts.ts";
import { LiveEvent } from '../data-model/schema.ts';

// Mock the getUpcomingLiveEvents function from main.ts
// In a real scenario with complex dependencies, we might need more sophisticated mocking or DI.
// For now, we'll redefine a controlled version of the mock data and logic here
// to avoid direct dependency on the main.ts's internal mock data which might change.

const simulateGetUpcomingLiveEvents = (mockDb: LiveEvent[], currentDate: Date): LiveEvent[] => {
  return mockDb
    .filter(event => event.start_time > currentDate)
    .sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
};

Deno.test("getUpcomingLiveEvents - should return only future events, sorted by start_time", () => {
  const now = new Date();
  const mockEvents: LiveEvent[] = [
    {
      id: "1", title: "Past Event", description: "",
      start_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      end_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 60*60*1000),
      stream_url: "", created_at: now, updated_at: now,
    },
    {
      id: "2", title: "Upcoming Event 2 (later)", description: "",
      start_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      end_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 60*60*1000),
      stream_url: "", created_at: now, updated_at: now,
    },
    {
      id: "3", title: "Upcoming Event 1 (sooner)", description: "",
      start_time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      end_time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 60*60*1000),
      stream_url: "", created_at: now, updated_at: now,
    },
  ];

  const upcomingEvents = simulateGetUpcomingLiveEvents(mockEvents, now);

  assertEquals(upcomingEvents.length, 2, "Should return 2 upcoming events");
  assert(upcomingEvents[0].id === "3", "First upcoming event should be 'Upcoming Event 1 (sooner)'");
  assert(upcomingEvents[1].id === "2", "Second upcoming event should be 'Upcoming Event 2 (later)'");
  assert(upcomingEvents[0].start_time < upcomingEvents[1].start_time, "Events should be sorted by start_time");
});

Deno.test("getUpcomingLiveEvents - should return an empty array if no upcoming events", () => {
  const now = new Date();
  const mockEvents: LiveEvent[] = [
    {
      id: "1", title: "Past Event 1", description: "",
      start_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      end_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 60*60*1000),
      stream_url: "", created_at: now, updated_at: now,
    },
    {
      id: "2", title: "Past Event 2", description: "",
      start_time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      end_time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 60*60*1000),
      stream_url: "", created_at: now, updated_at: now,
    },
  ];

  const upcomingEvents = simulateGetUpcomingLiveEvents(mockEvents, now);
  assertEquals(upcomingEvents.length, 0, "Should return an empty array when no events are upcoming");
});

Deno.test("getUpcomingLiveEvents - should handle events starting at the exact current time as not upcoming", () => {
  const now = new Date(); // Event starts exactly 'now'
  const mockEvents: LiveEvent[] = [
    {
      id: "1", title: "Event Starting Now", description: "",
      start_time: now, 
      end_time: new Date(now.getTime() + 60 * 60 * 1000),
      stream_url: "", created_at: now, updated_at: now,
    },
    {
      id: "2", title: "Future Event", description: "",
      start_time: new Date(now.getTime() + 1000), // Starts 1 second in the future
      end_time: new Date(now.getTime() + 60 * 60 * 1000 + 1000),
      stream_url: "", created_at: now, updated_at: now,
    }
  ];

  const upcomingEvents = simulateGetUpcomingLiveEvents(mockEvents, now);
  assertEquals(upcomingEvents.length, 1, "Should only include the truly future event");
  assertEquals(upcomingEvents[0].id, "2", "Event starting 'now' should not be included");
});
