import { contentTable } from '../schema.ts';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const CreateVideos = createInsertSchema(contentTable, {
	title: z.string().nonempty(),
	subtitle: z.string().nonempty(),
	contentType: z.string().nonempty(),
	description: z.string().nonempty(),
	publishedAt: z.date(),
});
