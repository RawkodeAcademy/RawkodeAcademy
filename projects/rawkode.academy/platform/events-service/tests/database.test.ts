import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { getLocalDb } from "../data-model/client";
import { eventsTable } from "../data-model/schema";
import { eq, gte } from "drizzle-orm";

describe("Events Database Operations", () => {
	let db: any;
	let testEventIds: string[] = [];

	beforeEach(async () => {
		db = await getLocalDb();
		testEventIds = [];
	});

	afterEach(async () => {
		for (const eventId of testEventIds) {
			await db.delete(eventsTable).where(eq(eventsTable.id, eventId));
		}
	});

	describe("event creation", () => {
		it("should create event with all required fields", async () => {
			const eventId = `test-event-${Date.now()}`;
			testEventIds.push(eventId);

			const eventData = {
				id: eventId,
				title: "Database Test Event",
				description: "Testing database operations",
				startDate: new Date("2025-06-15T14:00:00Z"),
				endDate: new Date("2025-06-15T16:00:00Z"),
			};

			await db.insert(eventsTable).values(eventData);

			const retrievedEvent = await db.query.eventsTable.findFirst({
				where: eq(eventsTable.id, eventId),
			});

			expect(retrievedEvent).toBeDefined();
			expect(retrievedEvent.id).toBe(eventId);
			expect(retrievedEvent.title).toBe("Database Test Event");
			expect(retrievedEvent.description).toBe("Testing database operations");
			expect(retrievedEvent.startDate).toEqual(eventData.startDate);
			expect(retrievedEvent.endDate).toEqual(eventData.endDate);
			expect(retrievedEvent.createdAt).toBeInstanceOf(Date);
		});

		it("should auto-generate createdAt timestamp", async () => {
			const eventId = `test-event-${Date.now()}`;
			testEventIds.push(eventId);

			const beforeInsert = new Date();
			
			await db.insert(eventsTable).values({
				id: eventId,
				title: "Timestamp Test",
				description: "Testing auto-generated timestamps",
				startDate: new Date("2025-07-01T10:00:00Z"),
				endDate: new Date("2025-07-01T11:00:00Z"),
			});

			const afterInsert = new Date();

			const event = await db.query.eventsTable.findFirst({
				where: eq(eventsTable.id, eventId),
			});

			expect(event?.createdAt).toBeInstanceOf(Date);
			expect(event?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
			expect(event?.createdAt.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
		});

		it("should enforce required fields", async () => {
			const eventId = `test-event-${Date.now()}`;
			testEventIds.push(eventId);

			await expect(
				db.insert(eventsTable).values({
					id: eventId,
					description: "Missing title",
					startDate: new Date(),
					endDate: new Date(),
				})
			).rejects.toThrow();
		});
	});

	describe("event querying", () => {
		beforeEach(async () => {
			const events = [
				{
					id: `past-event-${Date.now()}`,
					title: "Past Event",
					description: "Event in the past",
					startDate: new Date("2020-01-01T10:00:00Z"),
					endDate: new Date("2020-01-01T12:00:00Z"),
				},
				{
					id: `current-event-${Date.now()}`,
					title: "Current Event",
					description: "Event happening now",
					startDate: new Date("2025-06-01T10:00:00Z"),
					endDate: new Date("2025-06-01T12:00:00Z"),
				},
				{
					id: `future-event-${Date.now()}`,
					title: "Future Event",
					description: "Event in the future",
					startDate: new Date("2026-01-01T10:00:00Z"),
					endDate: new Date("2026-01-01T12:00:00Z"),
				},
			];

			for (const event of events) {
				testEventIds.push(event.id);
				await db.insert(eventsTable).values(event);
			}
		});

		it("should find event by id", async () => {
			const eventId = testEventIds[1];
			const event = await db.query.eventsTable.findFirst({
				where: eq(eventsTable.id, eventId),
			});

			expect(event).toBeDefined();
			expect(event?.id).toBe(eventId);
			expect(event?.title).toBe("Current Event");
		});

		it("should return null for non-existent event", async () => {
			const event = await db.query.eventsTable.findFirst({
				where: eq(eventsTable.id, "non-existent-id"),
			});

			expect(event).toBeUndefined();
		});

		it("should filter upcoming events correctly", async () => {
			const now = new Date();
			const upcomingEvents = await db.query.eventsTable.findMany({
				where: gte(eventsTable.startDate, now),
				orderBy: (event, { asc }) => asc(event.startDate),
			});

			expect(upcomingEvents.length).toBeGreaterThan(0);
			
			for (const event of upcomingEvents) {
				expect(event.startDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
			}

			for (let i = 1; i < upcomingEvents.length; i++) {
				expect(upcomingEvents[i].startDate.getTime()).toBeGreaterThanOrEqual(
					upcomingEvents[i - 1].startDate.getTime()
				);
			}
		});

		it("should respect limit in queries", async () => {
			const events = await db.query.eventsTable.findMany({
				limit: 2,
			});

			expect(events.length).toBeLessThanOrEqual(2);
		});
	});

	describe("data validation", () => {
		it("should handle unicode characters in text fields", async () => {
			const eventId = `unicode-event-${Date.now()}`;
			testEventIds.push(eventId);

			const eventData = {
				id: eventId,
				title: "🎉 Unicode Event 测试",
				description: "Event with émojis and spëcial characters: 你好世界",
				startDate: new Date("2025-08-01T10:00:00Z"),
				endDate: new Date("2025-08-01T12:00:00Z"),
			};

			await db.insert(eventsTable).values(eventData);

			const event = await db.query.eventsTable.findFirst({
				where: eq(eventsTable.id, eventId),
			});

			expect(event?.title).toBe("🎉 Unicode Event 测试");
			expect(event?.description).toBe("Event with émojis and spëcial characters: 你好世界");
		});

		it("should handle long text content", async () => {
			const eventId = `long-text-event-${Date.now()}`;
			testEventIds.push(eventId);

			const longDescription = "A".repeat(1000);

			const eventData = {
				id: eventId,
				title: "Long Description Event",
				description: longDescription,
				startDate: new Date("2025-09-01T10:00:00Z"),
				endDate: new Date("2025-09-01T12:00:00Z"),
			};

			await db.insert(eventsTable).values(eventData);

			const event = await db.query.eventsTable.findFirst({
				where: eq(eventsTable.id, eventId),
			});

			expect(event?.description).toBe(longDescription);
			expect(event?.description.length).toBe(1000);
		});

		it("should handle edge case dates", async () => {
			const eventId = `edge-date-event-${Date.now()}`;
			testEventIds.push(eventId);

			const eventData = {
				id: eventId,
				title: "Edge Date Event",
				description: "Testing edge case dates",
				startDate: new Date("2038-01-19T03:14:07Z"),
				endDate: new Date("2038-01-19T04:14:07Z"),
			};

			await db.insert(eventsTable).values(eventData);

			const event = await db.query.eventsTable.findFirst({
				where: eq(eventsTable.id, eventId),
			});

			expect(event?.startDate).toEqual(eventData.startDate);
			expect(event?.endDate).toEqual(eventData.endDate);
		});
	});

	describe("schema validation", () => {
		it("should not have updatedAt field in schema", () => {
			const columns = Object.keys(eventsTable);
			expect(columns).not.toContain("updatedAt");
			expect(columns).toContain("id");
			expect(columns).toContain("title");
			expect(columns).toContain("description");
			expect(columns).toContain("startDate");
			expect(columns).toContain("endDate");
			expect(columns).toContain("createdAt");
		});
	});
});
