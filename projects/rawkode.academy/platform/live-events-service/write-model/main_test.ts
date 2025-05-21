import { 
  assertEquals, 
  assertExists,
  assertNotEquals,
  assert,
} from "https://deno.land/std@0.207.0/testing/asserts.ts";
import { 
  createLiveEvent, 
  updateLiveEvent, 
  deleteLiveEvent 
} from "./main.ts"; // Assuming mockLiveEventsStore is managed internally by main.ts
import type { LiveEvent } from "../data-model/schema.ts";

// Helper function to clean up: delete all events created during tests.
// This is a workaround because we can't directly reset the mockLiveEventsStore from here.
// This relies on the fact that createLiveEvent returns the created event with its ID.
const createdEventIds: string[] = [];

async function cleanupTestEvents() {
  for (const id of createdEventIds) {
    await deleteLiveEvent(id);
  }
  createdEventIds.length = 0; // Clear the array
}

Deno.test("Write Model - LiveEvent CRUD Operations", async (t) => {
  
  await t.step("cleanup before tests", async () => {
    // Attempt to ensure a clean slate if previous tests in the same file run left things behind.
    // This is tricky without a dedicated reset function for the store in main.ts
    // For now, this cleanup will only work for IDs tracked by *this* test file.
    // If main.ts is re-imported, its store might reset. Let's assume for now it's a persistent store across calls within this file.
    // The best approach is to run tests in an order that makes sense or ensure main.ts exports a reset.
    // For now, we rely on the global `createdEventIds` and `cleanupTestEvents` called in a finally block.
  });

  let createdEvent: LiveEvent | null = null;

  await t.step("createLiveEvent - should create a new event", async () => {
    const eventData = {
      title: "Test Event",
      description: "This is a test event.",
      start_time: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      end_time: new Date(Date.now() + 7200 * 1000),   // 2 hours from now
      stream_url: "https://test.com/stream",
    };
    createdEvent = await createLiveEvent(eventData);
    assertExists(createdEvent, "Event should be created");
    assertExists(createdEvent.id, "Created event should have an ID");
    createdEventIds.push(createdEvent.id); // Track for cleanup

    assertEquals(createdEvent.title, eventData.title);
    assertEquals(createdEvent.description, eventData.description);
    assertExists(createdEvent.created_at, "Created event should have created_at timestamp");
    assertExists(createdEvent.updated_at, "Created event should have updated_at timestamp");
  });

  await t.step("updateLiveEvent - should update an existing event", async () => {
    assertExists(createdEvent, "Cannot run update test, event not created");
    const eventId = createdEvent.id;
    const updateData = {
      title: "Updated Test Event",
      description: "The event description has been updated.",
    };
    const originalUpdatedAt = createdEvent.updated_at;

    // Small delay to ensure updated_at timestamp can change
    await new Promise(resolve => setTimeout(resolve, 10)); 

    const updatedEvent = await updateLiveEvent(eventId, updateData);
    assertExists(updatedEvent, "Event should be updated");
    assertEquals(updatedEvent.id, eventId);
    assertEquals(updatedEvent.title, updateData.title);
    assertEquals(updatedEvent.description, updateData.description);
    assertNotEquals(updatedEvent.updated_at, originalUpdatedAt, "updated_at should change after update");
    
    // Update the reference in createdEvent for subsequent tests if needed
    if (updatedEvent) createdEvent = updatedEvent;
  });

  await t.step("updateLiveEvent - should return null for non-existent event ID", async () => {
    const nonExistentId = "non-existent-uuid";
    const result = await updateLiveEvent(nonExistentId, { title: "Try to update" });
    assertEquals(result, null, "Updating non-existent event should return null");
  });

  await t.step("deleteLiveEvent - should delete an existing event", async () => {
    assertExists(createdEvent, "Cannot run delete test, event not created or already deleted");
    const eventId = createdEvent.id;
    const success = await deleteLiveEvent(eventId);
    assert(success, "deleteLiveEvent should return true for successful deletion");
    
    // Verify it's actually deleted by trying to update it again
    const result = await updateLiveEvent(eventId, { title: "Attempt update after delete" });
    assertEquals(result, null, "Event should not be updatable after deletion");
    
    // Remove from cleanup list as it's already deleted
    const index = createdEventIds.indexOf(eventId);
    if (index > -1) createdEventIds.splice(index, 1);
    createdEvent = null; // Mark as deleted
  });

  await t.step("deleteLiveEvent - should return false for non-existent event ID", async () => {
    const nonExistentId = "non-existent-uuid-for-delete";
    const success = await deleteLiveEvent(nonExistentId);
    assert(!success, "deleteLiveEvent should return false for non-existent event");
  });

  // Ensure cleanup after all steps in this test suite
  // This is a 'finally' block for the Deno.test group.
  // However, Deno's test runner runs tests in parallel, so this cleanup might not be perfectly isolated
  // without more robust store management in main.ts.
  // The `createdEventIds` array and `cleanupTestEvents` are a best effort.
  try {
    // All steps have run.
  } finally {
    await cleanupTestEvents();
  }
});

// Separate test to ensure createLiveEvent assigns unique IDs
Deno.test("createLiveEvent - should assign unique IDs to new events", async () => {
  const eventData1 = {
    title: "Event 1 for ID test", description: "Desc 1",
    start_time: new Date(), end_time: new Date(), stream_url: "url1"
  };
  const eventData2 = {
    title: "Event 2 for ID test", description: "Desc 2",
    start_time: new Date(), end_time: new Date(), stream_url: "url2"
  };

  const event1 = await createLiveEvent(eventData1);
  const event2 = await createLiveEvent(eventData2);

  assertExists(event1, "Event 1 should be created");
  assertExists(event2, "Event 2 should be created");
  assertExists(event1.id, "Event 1 should have an ID");
  assertExists(event2.id, "Event 2 should have an ID");
  assertNotEquals(event1.id, event2.id, "IDs for two new events should be different");

  // Cleanup these events
  if (event1 && event1.id) await deleteLiveEvent(event1.id);
  if (event2 && event2.id) await deleteLiveEvent(event2.id);
});
