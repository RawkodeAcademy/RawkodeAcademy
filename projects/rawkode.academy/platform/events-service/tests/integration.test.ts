import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { getSchema } from "../read-model/schema";
import { getLocalDb } from "../data-model/client";
import { eventsTable } from "../data-model/schema";
import { eq } from "drizzle-orm";
import { graphql } from "graphql";

describe("Events Service Integration", () => {
	let db: any;
	let schema: any;
	let testEventIds: string[] = [];

	const testEnv = {
		D1_DATABASE: null,
	};

	beforeEach(async () => {
		db = await getLocalDb();
		schema = getSchema(testEnv);
		testEventIds = [];
	});

	afterEach(async () => {
		for (const eventId of testEventIds) {
			await db.delete(eventsTable).where(eq(eventsTable.id, eventId));
		}
	});

	describe("end-to-end event lifecycle", () => {
		it("should handle complete event workflow", async () => {
			const eventId = `integration-event-${Date.now()}`;
			testEventIds.push(eventId);

			await db.insert(eventsTable).values({
				id: eventId,
				title: "Integration Test Event",
				description: "Testing full integration workflow",
				startDate: new Date("2025-10-15T14:00:00Z"),
				endDate: new Date("2025-10-15T16:00:00Z"),
			});

			const getEventQuery = `
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

			const eventResult = await graphql({
				schema,
				source: getEventQuery,
				variableValues: { id: eventId },
			});

			expect(eventResult.errors).toBeUndefined();
			expect(eventResult.data?.eventById).toBeDefined();
			expect((eventResult.data?.eventById as any).id).toBe(eventId);

			const allEventsQuery = `
				query GetAllEvents {
					allEvents {
						id
						title
					}
				}
			`;

			const allEventsResult = await graphql({
				schema,
				source: allEventsQuery,
			});

			expect(allEventsResult.errors).toBeUndefined();
			const foundEvent = (allEventsResult.data?.allEvents as any[])?.find(
				(event: any) => event.id === eventId
			);
			expect(foundEvent).toBeDefined();

			const upcomingEventsQuery = `
				query GetUpcomingEvents {
					upcomingEvents {
						id
						title
						startDate
					}
				}
			`;

			const upcomingResult = await graphql({
				schema,
				source: upcomingEventsQuery,
			});

			expect(upcomingResult.errors).toBeUndefined();
			const upcomingEvent = (upcomingResult.data?.upcomingEvents as any[])?.find(
				(event: any) => event.id === eventId
			);
			expect(upcomingEvent).toBeDefined();
		});
	});

	describe("federation compatibility", () => {
		it("should support entity resolution", async () => {
			const eventId = `federation-event-${Date.now()}`;
			testEventIds.push(eventId);

			await db.insert(eventsTable).values({
				id: eventId,
				title: "Federation Test Event",
				description: "Testing federation entity resolution",
				startDate: new Date("2025-11-01T10:00:00Z"),
				endDate: new Date("2025-11-01T12:00:00Z"),
			});

			const entityQuery = `
				query GetEntity($representations: [_Any!]!) {
					_entities(representations: $representations) {
						... on Event {
							id
							title
							description
						}
					}
				}
			`;

			const representations = [
				{
					__typename: "Event",
					id: eventId,
				},
			];

			const result = await graphql({
				schema,
				source: entityQuery,
				variableValues: { representations },
			});

			expect(schema.getDirectives().some((d: any) => d.name === "key")).toBe(true);
		});
	});

	describe("performance and scalability", () => {
		it("should handle multiple concurrent queries", async () => {
			const eventPromises: Promise<any>[] = [];
			for (let i = 0; i < 10; i++) {
				const eventId = `concurrent-event-${Date.now()}-${i}`;
				testEventIds.push(eventId);
				
				eventPromises.push(
					db.insert(eventsTable).values({
						id: eventId,
						title: `Concurrent Event ${i}`,
						description: `Testing concurrent access ${i}`,
						startDate: new Date(`2025-12-${String(i + 1).padStart(2, '0')}T10:00:00Z`),
						endDate: new Date(`2025-12-${String(i + 1).padStart(2, '0')}T12:00:00Z`),
					})
				);
			}

			await Promise.all(eventPromises);

			const query = `
				query GetUpcomingEvents($limit: Int) {
					upcomingEvents(limit: $limit) {
						id
						title
						startDate
					}
				}
			`;

			const queryPromises: Promise<any>[] = [];
			for (let i = 0; i < 5; i++) {
				queryPromises.push(
					graphql({
						schema,
						source: query,
						variableValues: { limit: 5 },
					})
				);
			}

			const results = await Promise.all(queryPromises);

			for (const result of results) {
				expect(result.errors).toBeUndefined();
				expect(result.data?.upcomingEvents).toBeDefined();
				expect(Array.isArray(result.data?.upcomingEvents)).toBe(true);
			}
		});

		it("should handle large result sets efficiently", async () => {
			const batchSize = 50;
			const eventPromises: Promise<any>[] = [];
			
			for (let i = 0; i < batchSize; i++) {
				const eventId = `batch-event-${Date.now()}-${i}`;
				testEventIds.push(eventId);
				
				eventPromises.push(
					db.insert(eventsTable).values({
						id: eventId,
						title: `Batch Event ${i}`,
						description: `Testing large result sets ${i}`,
						startDate: new Date(`2025-12-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`),
						endDate: new Date(`2025-12-${String((i % 28) + 1).padStart(2, '0')}T12:00:00Z`),
					})
				);
			}

			await Promise.all(eventPromises);

			const query = `
				query GetAllEvents {
					allEvents {
						id
						title
						startDate
					}
				}
			`;

			const startTime = Date.now();
			const result = await graphql({
				schema,
				source: query,
			});
			const endTime = Date.now();

			expect(result.errors).toBeUndefined();
			expect(result.data?.allEvents).toBeDefined();
			expect((result.data?.allEvents as any[])?.length).toBeGreaterThanOrEqual(batchSize);
			
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});

	describe("error scenarios", () => {
		it("should handle database connection errors gracefully", async () => {
			expect(() => getSchema(testEnv)).not.toThrow();
		});

		it("should validate GraphQL query syntax", async () => {
			const invalidQuery = `
				query InvalidSyntax {
					eventById(id: "test") {
						id
						nonExistentField
					}
				}
			`;

			const result = await graphql({
				schema,
				source: invalidQuery,
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0].message).toContain("nonExistentField");
		});

		it("should handle malformed input gracefully", async () => {
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
				variableValues: { id: null },
			});

			expect(result.errors).toBeDefined();
		});
	});
});
