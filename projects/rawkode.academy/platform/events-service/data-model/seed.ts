import { db } from './client.ts';
import { eventsTable } from './schema.ts';

const seed = async () => {
	await db
		.insert(eventsTable)
		.values({
			id: 'sample-event',
			title: 'Sample Event',
			description: 'This is a sample event for testing',
			startDate: new Date('2025-07-01T10:00:00Z'),
			endDate: new Date('2025-07-01T12:00:00Z'),
		})
		.returning()
		.all();

	db.$client.close();
	Deno.exit(0);
};

await seed();
db.$client.close();
