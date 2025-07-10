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
import { GoogleGenAI } from "@google/genai";

type Env = {
	DEEPGRAM_API_TOKEN: SecretsStoreSecret;
	GEMINI_API_KEY: SecretsStoreSecret;
	TRANSCRIPTIONS_BUCKET: R2Bucket;
};

export type Params = {
	videoId: string;
	language: string;
	force?: boolean;
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
		const { videoId, language, force = false } = event.payload;
		const env = this.env;

		// Check if captions already exist (skip check if force is true)
		let captionsExist = false;

		let deepgramTranscriptionExists = false;

		if (!force) {
			captionsExist = await step.do("check if captions exist", async () => {
				const captionsKey = `videos/${videoId}/captions/en.vtt`;
				const existingCaptions =
					await env.TRANSCRIPTIONS_BUCKET.head(captionsKey);
				return existingCaptions !== null;
			});

			if (captionsExist) {
				console.log(
					`Captions already exist for video ${videoId}, skipping transcription`,
				);
				return { success: true, skipped: true };
			}

			// Check if Deepgram transcription already exists
			deepgramTranscriptionExists = await step.do("check if deepgram transcription exists", async () => {
				const deepgramKey = `videos/${videoId}/transcription/deepgram.json`;
				const existingTranscription =
					await env.TRANSCRIPTIONS_BUCKET.head(deepgramKey);
				return existingTranscription !== null;
			});

			if (deepgramTranscriptionExists) {
				console.log(
					`Deepgram transcription already exists for video ${videoId}, skipping Deepgram API call`,
				);
			}
		} else {
			console.log(
				`Force parameter set to true for video ${videoId}, proceeding with transcription regardless of existing captions`,
			);
		}

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

		let deepgramKey = `videos/${videoId}/transcription/deepgram.json`;

		// Only call Deepgram API if transcription doesn't already exist
		if (!deepgramTranscriptionExists) {
			const deepgram = createClient(await env.DEEPGRAM_API_TOKEN.get());

			deepgramKey = await step.do(
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
					const deepgramKey = `videos/${videoId}/transcription/deepgram.json`;
					await env.TRANSCRIPTIONS_BUCKET.put(
						deepgramKey,
						JSON.stringify(deepgramResponse.result),
						{
							httpMetadata: { contentType: "application/json" },
						},
					);

					return deepgramKey;
				},
			);
		} else {
			console.log(
				`Using existing Deepgram transcription from R2: ${deepgramKey}`,
			);
		}

		// Save the original Deepgram WebVTT
		await step.do("save deepgram WebVTT", async () => {
			const r2Response = await env.TRANSCRIPTIONS_BUCKET.get(deepgramKey);
			if (!r2Response) {
				throw new Error("Failed to retrieve Deepgram response from R2");
			}

			const deepgramResponse =
				(await r2Response.json()) as SyncPrerecordedResponse;
			const deepgramVtt = webvtt(deepgramResponse);

			const deepgramVttKey = `videos/${videoId}/captions/en.deepgram.vtt`;
			await env.TRANSCRIPTIONS_BUCKET.put(deepgramVttKey, deepgramVtt, {
				httpMetadata: { contentType: "text/vtt" },
			});

			return deepgramVttKey;
		});

		// Process WebVTT with AI
		await step.do(
			"review and correct transcript with AI",
			{
				retries: {
					limit: 1,
					delay: "1 minute",
					backoff: "exponential",
				},
				timeout: "24 hours",
			},
			async () => {
				const r2Response = await env.TRANSCRIPTIONS_BUCKET.get(deepgramKey);
				if (!r2Response) {
					throw new Error("Failed to retrieve Deepgram response from R2");
				}

				const deepgramResponse =
					(await r2Response.json()) as SyncPrerecordedResponse;
				const vttContent = webvtt(deepgramResponse);

				const context = `Rawkode Academy is a technology education platform. The host, David Flanagan (aka Rawkode), is known for deep technical content, especially in cloud native, Kubernetes, and developer tooling. Keyterms: ${keyterms.join(", ")}`;

				// Use Google Gemini to correct the entire transcript at once
				console.log(`Processing transcript with Gemini using file upload`);

				try {
					const apiKey = await env.GEMINI_API_KEY.get();
					console.log(`Retrieved API key, length: ${apiKey?.length || 0}`);

					const ai = new GoogleGenAI({ apiKey });
					console.log(`Initialized GoogleGenAI client`);

					// Convert WebVTT content to a Blob for file upload
					const vttBlob = new Blob([vttContent], { type: "text/plain" });
					const vttBuffer = await vttBlob.arrayBuffer();
					const vttUint8Array = new Uint8Array(vttBuffer);

					console.log(`Uploading WebVTT file to Gemini, size: ${vttUint8Array.length} bytes`);

					// Upload the file
					const uploadResult = await ai.files.upload({
						file: vttBlob,
						config: {
							mimeType: "text/plain",
							displayName: `${videoId}_transcript.vtt`,
						}
					});

					console.log(`File uploaded successfully: ${uploadResult.uri}`);
					if (uploadResult.error) {
						throw new Error(
							`File upload failed: ${uploadResult.error.message}`,
						);
					}

					let file;
					// Wait for file to be ready for processing
					while (uploadResult.state === "PROCESSING") {
						await new Promise(resolve => setTimeout(resolve, 1000));
						file = await ai.files.get({name: uploadResult.name});
					}

					if (!file || !file.name) {
						throw new Error(`File upload failed: No file name returned`);
					}

					const prompt = `You are an expert transcription corrector for technical content. Review the attached WebVTT transcript file for accuracy, focusing on technical terms and names.

Context: ${context}

CRITICAL: Your response must start with "WEBVTT" and maintain the exact WebVTT format including timestamps, speaker tags, and line breaks. Only fix technical terms, proper names, and transcription errors. Do not add, remove, or modify the structure.

Please review and correct the WebVTT transcript in the attached file.`;

					console.log(`Making API call to Gemini with uploaded file...`);
					const startTime = Date.now();

					let response;
					try {
						response = await ai.models.generateContent({
							model: "gemini-2.5-pro",
							contents: [
								{
									role: "user",
									parts: [
										{ text: prompt },
										{
											fileData: {
												mimeType: file.mimeType,
												fileUri: file.uri,
											},
										},
									],
								},
							],
							config: {
								temperature: 0.5,
							},
						});

						const elapsed = Date.now() - startTime;
						console.log(`Received response from Gemini after ${elapsed}ms`);

						// Clean up the uploaded file
						try {
							await ai.files.delete({ name: file.name });
							console.log(`Deleted uploaded file: ${file.name}`);
						} catch (deleteError) {
							console.warn(`Failed to delete uploaded file: ${deleteError}`);
						}
					} catch (apiError) {
						const elapsed = Date.now() - startTime;
						console.error(`Gemini API error after ${elapsed}ms:`, apiError);
						console.error(`API error details:`, {
							message:
								apiError instanceof Error ? apiError.message : "Unknown error",
							type: typeof apiError,
							apiError,
						});
						throw new Error(
							`Gemini API failed: ${apiError instanceof Error ? apiError.message : "Unknown error"}`,
						);
					}

					let correctedVtt: string | undefined;
					try {
						// Check if response exists and has expected structure
						if (!response || typeof response !== "object") {
							throw new Error("Invalid response structure from Gemini API");
						}

						// Extract text from the response
						correctedVtt = response.text?.trim();
						console.log(`Response length: ${correctedVtt?.length || 0} characters`);
					} catch (parseError) {
						console.error(`Error parsing Gemini response:`, parseError);
						console.error(`Response object:`, response);
						throw new Error(
							`Failed to parse Gemini response: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}`,
						);
					}

					// Validate that we got a response
					if (!correctedVtt) {
						throw new Error("Gemini returned empty response");
					}

					// Validate that the model followed instructions
					if (!correctedVtt.startsWith("WEBVTT")) {
						throw new Error(
							"AI model failed to follow WebVTT format instructions - response does not start with WEBVTT header",
						);
					}

					console.log(`WebVTT validation passed, storing corrected transcript`);

					// Store the corrected WebVTT
					const correctedVttKey = `videos/${videoId}/captions/en.vtt`;
					await env.TRANSCRIPTIONS_BUCKET.put(correctedVttKey, correctedVtt, {
						httpMetadata: { contentType: "text/vtt" },
					});

					console.log(
						`Successfully stored corrected transcript at: ${correctedVttKey}`,
					);

					return correctedVttKey;
				} catch (error) {
					console.error(`Gemini API error:`, error);
					if (error instanceof Error) {
						console.error(`Error details:`, {
							name: error.name,
							message: error.message,
							stack: error.stack,
						});
					}
					throw error;
				}
			},
		);

		return { success: true };
	}
}
