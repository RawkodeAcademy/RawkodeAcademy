// Single video transcription script
const TRANSCRIPTION_ENDPOINT = "https://transcriptions.rawkodeacademy.workers.dev";

async function triggerTranscription(videoId: string, force: boolean = false): Promise<void> {
	console.log(`Triggering transcription for video ID: ${videoId}${force ? ' (forced)' : ''}`);
	try {
		const payload: any = { videoId: videoId, language: "en" };
		if (force) {
			payload.force = true;
		}

		const response = await fetch(TRANSCRIPTION_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env.HTTP_TRANSCRIPTION_TOKEN}`,
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(
				`Error triggering transcription for ${videoId}: ${response.status} - ${errorBody}`,
			);
			process.exit(1);
		} else {
			const result = (await response.json()) as { workflowId: string };
			console.log(
				`Successfully triggered transcription for video ID: ${videoId}, workflow ID: ${result.workflowId}`,
			);
		}
	} catch (error) {
		console.error(
			`Network or other error triggering transcription for ${videoId}:`,
			error,
		);
		process.exit(1);
	}
}

async function main() {
	const videoId = process.argv[2];
	const forceArg = process.argv[3];

	if (!videoId) {
		console.error("Usage: bun run scripts/schedule_single.ts <video-id> [--force]");
		console.error("Example: bun run scripts/schedule_single.ts abc123");
		console.error("Example: bun run scripts/schedule_single.ts abc123 --force");
		process.exit(1);
	}

	const force = forceArg === '--force' || forceArg === '-f';

	console.log(`Processing single video ID: ${videoId}${force ? ' with force=true' : ''}`);

	// Trigger the transcription
	await triggerTranscription(videoId, force);

	console.log("Transcription triggered successfully. Check Cloudflare dashboard for progress.");
}

main().catch((error) => {
	console.error("Error in main:", error);
	process.exit(1);
});
