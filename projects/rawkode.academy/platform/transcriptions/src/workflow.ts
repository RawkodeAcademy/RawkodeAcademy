import {
	WorkflowEntrypoint,
	type WorkflowStep,
	type WorkflowEvent,
} from "cloudflare:workers";
import {
	createClient,
	webvtt,
	type SyncPrerecordedResponse,
} from "@deepgram/sdk";
import { gql, request } from "graphql-request";

type Env = {
	AI: Ai;
	DEEPGRAM_API_TOKEN: SecretsStoreSecret;
	TRANSCRIPTIONS_BUCKET: R2Bucket;
};

export type Params = {
	videoId: string;
	language: string;
};

const GET_VIDEO_TERMS = gql`
  query GetVideoTerms($videoId: String!) {
    videoByID(id: $videoId) {
      technologies {
        id
        name
        terms {
          term
        }
      }
    }
  }
`;

interface VideoResponse {
	videoByID: {
		technologies: { id: string; name: string; terms: { term: string }[] }[];
	};
}

async function fetchVideoTerms(videoId: string): Promise<string[]> {
	const endpoint = "https://api.rawkode.academy/graphql";
	const data = (await request(endpoint, GET_VIDEO_TERMS, {
		videoId,
	})) as VideoResponse;
	const terms: string[] = data.videoByID.technologies.map(
		(tech: any) => tech.name,
	);
	return [...new Set(terms)];
}

export class TranscribeWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		const { videoId, language } = event.payload;
		const env = this.env;

		const videoTerms = await step.do("fetch video terms", () =>
			fetchVideoTerms(videoId),
		);
		const keyterms = [
			"Flanagan",
			"Rawkode",
			"Rawkode Academy",
			"Kubernetes",
			...videoTerms,
		];

		const deepgram = createClient(await env.DEEPGRAM_API_TOKEN.get());

		await step.do(
			"transcribe with Deepgram",
			{
				retries: {
					limit: 7,
					delay: "10 minutes",
					backoff: "exponential",
				},
				timeout: "24 hours",
			},
			async () => {
				const deepgramResponse =
					(await deepgram.listen.prerecorded.transcribeUrl(
						{
							url: `https://content.rawkode.academy/videos/${videoId}/audio.mp3`,
						},
						{
							model: "nova-3",
							language,
							keyterm: keyterms,
							smart_format: true,
							detect_entities: true,
							diarize: true,
							paragraphs: true,
							profanity_filter: false,
							punctuate: true,
							utterances: true,
							replace: ["rawcode:Rawkode"],
						},
					)) as {
						result: SyncPrerecordedResponse | null;
						error: { message: string; [key: string]: any } | null;
					};

				// Improved error handling for the Deepgram step
				if (deepgramResponse.error) {
					console.error(
						`Deepgram transcription failed for video ${videoId}. Error:`,
						JSON.stringify(deepgramResponse.error, null, 2), // Log the full error object
					);
					throw new Error(
						`Deepgram transcription failed for video ${videoId}: ${deepgramResponse.error.message}`,
					);
				}

				// Also check if the result is missing, even if no explicit error is set
				if (!deepgramResponse.result) {
					console.error(
						`Deepgram transcription returned no result for video ${videoId}. Full response:`,
						JSON.stringify(deepgramResponse, null, 2), // Log the full response
					);
					throw new Error(
						`Deepgram transcription returned no result for video ${videoId}.`,
					);
				}

				// Store the Deepgram response in R2 to avoid serialization issues
				// Cloudflare Workflows has size limits on serialized step data
				const deepgramKey = `videos/${videoId}/deepgram-response.json`;
				await env.TRANSCRIPTIONS_BUCKET.put(
					deepgramKey,
					JSON.stringify(deepgramResponse.result),
					{
						httpMetadata: { contentType: "application/json" },
					},
				);
			},
		);

		// 2. Review and correct transcript with Workers AI
		const context = `Rawkode Academy is a technology education platform. The host, David Flanagan (aka Rawkode), is known for deep technical content, especially in cloud native, Kubernetes, and developer tooling. Keyterms: ${keyterms.join(", ")}`;

		let aiPrompt: string;

		let correctedTranscript: SyncPrerecordedResponse;
		// The "review and correct transcript with Workers AI" step will now rely on
		// step.do's built-in retry mechanism.
		// If this step ultimately fails after its retries, the workflow will fail.
		const aiResponse = await step.do(
			"review and correct transcript with Workers AI",
			async () => {
				const deepgramKey = `videos/${videoId}/deepgram-response.json`;
				const r2Response = await env.TRANSCRIPTIONS_BUCKET.get(deepgramKey);
				if (!r2Response) {
					throw new Error("Failed to retrieve Deepgram response from R2");
				}
				
				const deepgramResponseFromR2 = await r2Response.text();
				aiPrompt = `You are an expert transcription corrector for technical content. Review this transcript for accuracy, focusing on technical terms and names. Context: ${context}\n\nTranscript:\n${deepgramResponseFromR2}\n\nReturn ONLY the corrected transcript as valid JSON, matching the original structure.`;

				const response = await env.AI.run(
					"@cf/meta/llama-3.1-8b-instruct-fast",
					{
						prompt: aiPrompt,
						max_tokens: 131072, // 128k context window
						temperature: 0.2,
						stream: false,
					},
				);
				// Ensure serializability of the AI response
				return JSON.parse(JSON.stringify(response));
			},
			// Optional: If specific retry behavior is needed for this AI step,
			// configure it here, e.g.:
			// {
			//   retry: {
			//     initialInterval: "1 minute",
			//     maxAttempts: 5,
			//     backoffCoefficient: 1.5,
			//   },
			// }
		);

		// Parse and validate the AI response
		const parsedResponse =
			typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;

		// Validate the structure matches Deepgram's response type
		if (!isValidDeepgramResponse(parsedResponse)) {
			throw new Error(
				"AI response does not match expected Deepgram response structure",
			);
		}

		// Try to generate VTT to validate the transcript.
		// If this fails, it indicates an issue with the AI's corrected transcript.
		try {
			webvtt(parsedResponse);
		} catch (e) {
			// Propagate the error to fail the step, triggering step.do retries if configured.
			throw new Error(
				`Failed to generate VTT from corrected transcript: ${
					e instanceof Error ? e.message : String(e)
				}`,
			);
		}

		correctedTranscript = parsedResponse;
		// If the AI step (including the step.do call, subsequent parsing, validation,
		// or VTT generation) throws an error, and all (default or configured)
		// step.do retries are exhausted, the workflow will fail at this point.
		// The previous manual fallback to the original Deepgram transcript has been removed.

		// 3. Upload corrected transcript JSON to R2
		await step.do("upload transcription JSON to R2", async () => {
			const transcript = JSON.stringify(correctedTranscript);
			const transcriptKey = `videos/${videoId}/transcription.json`;
			await env.TRANSCRIPTIONS_BUCKET.put(transcriptKey, transcript, {
				httpMetadata: { contentType: "application/json" },
			});
		});

		// 4. Upload captions to R2 (from corrected transcript)
		await step.do("upload captions to R2", async () => {
			const captions = webvtt(correctedTranscript);
			const captionsKey = `videos/${videoId}/captions/en.vtt`;
			const encoder = new TextEncoder();
			const captionsBytes = encoder.encode(captions);
			await env.TRANSCRIPTIONS_BUCKET.put(captionsKey, captionsBytes, {
				httpMetadata: { contentType: "text/vtt" },
			});
		});

		return { success: true };
	}
}

// Helper function to validate Deepgram response structure
function isValidDeepgramResponse(
	response: any,
): response is SyncPrerecordedResponse {
	return (
		response &&
		typeof response === "object" &&
		response.metadata &&
		typeof response.metadata === "object" &&
		typeof response.metadata.transaction_key === "string" &&
		typeof response.metadata.request_id === "string" &&
		typeof response.metadata.sha256 === "string" &&
		typeof response.metadata.created === "string" &&
		typeof response.metadata.duration === "number" &&
		typeof response.metadata.channels === "number" &&
		Array.isArray(response.metadata.models) &&
		response.results &&
		typeof response.results === "object" &&
		Array.isArray(response.results.channels) &&
		response.results.channels.every(
			(channel: any) =>
				Array.isArray(channel.alternatives) &&
				channel.alternatives.every(
					(alt: any) =>
						typeof alt.transcript === "string" &&
						typeof alt.confidence === "number" &&
						Array.isArray(alt.words) &&
						alt.words.every(
							(word: any) =>
								typeof word.word === "string" &&
								typeof word.start === "number" &&
								typeof word.end === "number" &&
								typeof word.confidence === "number" &&
								typeof word.punctuated_word === "string",
						),
				),
		)
	);
}
