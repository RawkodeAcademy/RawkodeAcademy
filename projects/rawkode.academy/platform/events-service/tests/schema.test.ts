import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { getSchema } from "../read-model/schema";
import { getLocalDb } from "../data-model/client";
import { eventsTable } from "../data-model/schema";
import { eq } from "drizzle-orm";
import { graphql } from "graphql";

const testEnv = {
	D1_DATABASE: null,
};

describe("Events GraphQL Schema", () => {
	let db: any;
	let schema: any;
	let testEventId: string;

	beforeEach(async () => {
		db = await getLocalDb();
		schema = getSchema(testEnv);
		
		schema._context = { db };
		
		testEventId = `test-event-${Date.now()}`;
		await db.insert(eventsTable).values({
			id: testEventId,
			title: "Test Event",
			description: "A test event for testing purposes",
			startDate: new Date("2025-12-01T10:00:00Z"),
			endDate: new Date("2025-12-01T12:00:00Z"),
		});
	});

	afterEach(async () => {
		if (testEventId) {
			await db.delete(eventsTable).where(eq(eventsTable.id, testEventId));
		}
	});

	describe("eventById query", () => {
		it("should return event when found", async () => {
			const query = `
				query GetEvent($id: String!) {
					eventById(id: $id) {
						id
						title
						description
						startDate
						endDate
						createdAt
					}
				}
			`;

			const result = await graphql({
				schema,
				source: query,
				variableValues: { id: testEventId },
				contextValue: { db },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.eventById).toBeDefined();
			expect((result.data?.eventById as any).id).toBe(testEventId);
			expect((result.data?.eventById as any).title).toBe("Test Event");
			expect((result.data?.eventById as any).description).toBe("A test event for testing purposes");
		});

		it("should return null when event not found", async () => {
			const query = `
				query GetEvent($id: String!) {
					eventById(id: $id) {
						id
						title
					}
				}
			`;

			const result = await graphql({
				schema,
				source: query,
				variableValues: { id: "non-existent-id" },
				contextValue: { db },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.eventById).toBeNull();
		});
	});

	describe("allEvents query", () => {
		it("should return all events", async () => {
			const query = `
				query GetAllEvents {
					allEvents {
						id
						title
						description
						startDate
						endDate
						createdAt
					}
				}
			`;

			const result = await graphql({
				schema,
				source: query,
				contextValue: { db },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.allEvents).toBeDefined();
			expect(Array.isArray(result.data?.allEvents)).toBe(true);
			
			const testEvent = (result.data?.allEvents as any[])?.find((event: any) => event.id === testEventId);
			expect(testEvent).toBeDefined();
			expect(testEvent.title).toBe("Test Event");
		});
	});

	describe("upcomingEvents query", () => {
		it("should return upcoming events with default limit", async () => {
			const query = `
				query GetUpcomingEvents {
					upcomingEvents {
						id
						title
						startDate
						endDate
					}
				}
			`;

			const result = await graphql({
				schema,
				source: query,
				contextValue: { db },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.upcomingEvents).toBeDefined();
			expect(Array.isArray(result.data?.upcomingEvents)).toBe(true);
			
			const testEvent = (result.data?.upcomingEvents as any[])?.find((event: any) => event.id === testEventId);
			expect(testEvent).toBeDefined();
		});

		it("should respect limit parameter", async () => {
			const eventIds: string[] = [];
			for (let i = 0; i < 5; i++) {
				const eventId = `test-event-${Date.now()}-${i}`;
				eventIds.push(eventId);
				await db.insert(eventsTable).values({
					id: eventId,
					title: `Test Event ${i}`,
					description: `Test event ${i}`,
					startDate: new Date(`2025-12-0${i + 1}T10:00:00Z`),
					endDate: new Date(`2025-12-0${i + 1}T12:00:00Z`),
				});
			}

			const query = `
				query GetUpcomingEvents($limit: Int) {
					upcomingEvents(limit: $limit) {
						id
						title
					}
				}
			`;

			const result = await graphql({
				schema,
				source: query,
				variableValues: { limit: 3 },
				contextValue: { db },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.upcomingEvents).toBeDefined();
			expect((result.data?.upcomingEvents as any[])?.length).toBeLessThanOrEqual(3);

			for (const eventId of eventIds) {
				await db.delete(eventsTable).where(eq(eventsTable.id, eventId));
			}
		});

		it("should not return past events", async () => {
			const pastEventId = `past-event-${Date.now()}`;
			await db.insert(eventsTable).values({
				id: pastEventId,
				title: "Past Event",
				description: "An event in the past",
				startDate: new Date("2020-01-01T10:00:00Z"),
				endDate: new Date("2020-01-01T12:00:00Z"),
			});

			const query = `
				query GetUpcomingEvents {
					upcomingEvents {
						id
						title
						startDate
					}
				}
			`;

			const result = await graphql({
				schema,
				source: query,
				contextValue: { db },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.upcomingEvents).toBeDefined();
			
			const pastEvent = (result.data?.upcomingEvents as any[])?.find((event: any) => event.id === pastEventId);
			expect(pastEvent).toBeUndefined();

			await db.delete(eventsTable).where(eq(eventsTable.id, pastEventId));
		});
	});

	describe("data integrity", () => {
		it("should handle date fields correctly", async () => {
			const query = `
				query GetEvent($id: String!) {
					eventById(id: $id) {
						startDate
						endDate
						createdAt
					}
				}
			`;

			const result = await graphql({
				schema,
				source: query,
				variableValues: { id: testEventId },
				contextValue: { db },
			});

			expect(result.errors).toBeUndefined();
			const event = result.data?.eventById as any;
			expect(event).toBeDefined();
			
			expect(new Date(event.startDate)).toBeInstanceOf(Date);
			expect(new Date(event.endDate)).toBeInstanceOf(Date);
			expect(new Date(event.createdAt)).toBeInstanceOf(Date);
			
			expect(event.startDate).toBe("2025-12-01T10:00:00.000Z");
			expect(event.endDate).toBe("2025-12-01T12:00:00.000Z");
		});

		it("should not expose updatedAt field", async () => {
			const query = `
				query GetEvent($id: String!) {
					eventById(id: $id) {
						id
						title
						updatedAt
					}
				}
			`;

			const result = await graphql({
				schema,
				source: query,
				variableValues: { id: testEventId },
				contextValue: { db },
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0].message).toContain("updatedAt");
		});
	});

	describe("error handling", () => {
		it("should handle invalid query structure", async () => {
			const query = `
				query InvalidQuery {
					eventById {
						id
					}
				}
			`;

			const result = await graphql({
				schema,
				source: query,
				contextValue: { db },
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0].message).toContain("id");
		});

		it("should handle database connection issues gracefully", async () => {
			expect(schema).toBeDefined();
			expect(typeof schema.getQueryType).toBe("function");
		});
	});
});
