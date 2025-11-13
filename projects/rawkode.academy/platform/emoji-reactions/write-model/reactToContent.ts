import { WorkflowEntrypoint, WorkflowStep, type WorkflowEvent } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import { emojiReactionsTable } from "../data-model/schema";
import { normalizePersonId } from "../data-model/personId-resolver";

type Env = {
	DB: D1Database;
	AUTH_DB: D1Database;
};

type Params = {
	contentId: string;
	personId: string;
	emoji: string;
	contentTimestamp?: number;
};

export class ReactToContentWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		// Step 1: Resolve the personId to canonical Better Auth user ID
		const canonicalPersonId = await step.do('resolvePersonId', async () => {
			const { personId } = event.payload;

			// Normalize the person ID (handles both legacy Zitadel and new Better Auth IDs)
			const resolved = await normalizePersonId(personId, this.env.AUTH_DB);

			console.log(`Resolved personId: ${personId} -> ${resolved}`);
			return resolved;
		});

		// Step 2: Persist the reaction to D1 with the canonical person ID
		await step.do('persistReactionToD1', async () => {
			const { contentId, emoji, contentTimestamp } = event.payload;
			const db = drizzle(this.env.DB);

			await db
				.insert(emojiReactionsTable)
				.values({
					contentId,
					personId: canonicalPersonId,
					emoji,
					reactedAt: new Date(),
					contentTimestamp: contentTimestamp ?? 0,
				});

			return { success: true };
		});
	}
}
