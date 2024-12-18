import { episodesTable } from '../schema.ts';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const CreateEpisode = createInsertSchema(episodesTable, {
	contentId: z.string().nonempty(),
	showId: z.string().nonempty(),
	code: z.string().nonempty(),
});
