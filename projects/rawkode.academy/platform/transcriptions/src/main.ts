import type { TranscribeWorkflow } from "./workflow";
export * from "./workflow";

export interface Env {
		AI: Ai;
		DEEPGRAM_API_TOKEN: SecretsStoreSecret;
		TRANSCRIPTIONS_BUCKET: R2Bucket;
		TRANSCRIPTION_WORKFLOW: Workflow<TranscribeWorkflow>;
	}

type Payload = {
	videoId: string;
	language: string;
};

export default {
	async fetch(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		console.log("We have a request");

		if (request.method !== "POST") {
			console.log("Method not allowed");
			return new Response("Method Not Allowed", { status: 405 });
		}

		let params: Payload;
		try {
			params = (await request.json()) as Payload;

			console.log(`Payload: ${JSON.stringify(params)}`);

			if (!params.videoId || !params.language) {
				return new Response("Missing videoId or language in request body", {
					status: 400,
				});
			}
		} catch (e) {
			return new Response("Invalid JSON in request body", { status: 400 });
		}

		// Use the Cloudflare Workflows API to start the workflow
		console.log("Starting workflow");
		const instance = await env.TRANSCRIPTION_WORKFLOW.create({ params });

		return new Response(JSON.stringify({ workflowId: instance.id }), {
			headers: { "Content-Type": "application/json" },
		});
	},
};
