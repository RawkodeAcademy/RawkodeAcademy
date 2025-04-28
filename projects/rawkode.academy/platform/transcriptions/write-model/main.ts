import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient, webvtt } from "@deepgram/sdk";
import {
	type Context,
	endpoint,
	service,
	TerminalError,
} from "@restatedev/restate-sdk-cloudflare-workers/fetch";
import { gql, request } from "graphql-request";
import process from "node:process";

// Set environment variable for web crypto
process.env.USE_WEB_CRYPTO = "true";

interface Config {
	language: string;
	videoId: string;
}

interface Technology {
	id: string;
	name: string;
	terms: { term: string }[];
}

interface VideoResponse {
	videoByID: {
		technologies: Technology[];
	};
}

// GraphQL query to fetch video technologies and terms
const GET_VIDEO_TERMS = gql`
	query GetVideoTerms($videoId: ID!) {
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

/**
 * Fetches technology terms for a video to improve transcription accuracy
 */
const fetchVideoTerms = async (videoId: string): Promise<string[]> => {
	try {
		const endpoint =
			process.env.GRAPHQL_API_ENDPOINT || "https://api.rawkode.academy/graphql";

		const data = await request<VideoResponse>(endpoint, GET_VIDEO_TERMS, {
			videoId,
		});

		// Extract all terms from all technologies
		const terms: string[] = [];

		// Add technology names
		for (const tech of data.videoByID.technologies) {
			terms.push(tech.name);

			// Add all terms for this technology
			for (const termObj of tech.terms) {
				terms.push(termObj.term);
			}
		}

		// Return unique terms
		return [...new Set(terms)];
	} catch (error) {
		console.warn("Failed to fetch video terms:", error);
		// Return empty array if there's an error, so transcription can still proceed
		return [];
	}
};

interface R2Config {
	endpoint: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
}

const transcriptionService = service({
	name: "transcription",
	handlers: {
		transcribeVideoById: async (ctx: Context, config: Config) => {
			const r2Config = JSON.parse(process.env.CLOUDFLARE_R2_CONFIG || "") as R2Config;

			const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

			const bucketName = r2Config.bucket;


			const r2Client = new S3Client({
				region: "auto",
				endpoint: r2Config.endpoint,
				credentials: {
					accessKeyId: r2Config.accessKeyId,
					secretAccessKey: r2Config.secretAccessKey,
				},
			});

			const myRunRetryPolicy = {
				// 5 minutes
				initialRetryIntervalMillis: 300000,
				maxRetryIntervalMillis: 3000000,
				retryIntervalFactor: 5,
				maxRetryAttempts: 1024,
				// 3 days
				maxRetryDurationMillis: 259200000,
			};

			// Fetch technology terms for the video
			console.log(`Fetching technology terms for video: ${config.videoId}`);
			const videoTerms = await fetchVideoTerms(config.videoId);

			// Combine default terms with video-specific terms
			const keyterms = ["Rawkode", "Rawkode Academy", ...videoTerms];
			console.log(`Using keyterms for transcription: ${keyterms.join(", ")}`);

			const result = await ctx.run(
				"transcription",
				async () => {
					const { result, error } =
						await deepgram.listen.prerecorded.transcribeUrl(
							{
								url: `https://content.rawkode.academy/videos/${config.videoId}/original.mkv`,
							},
							{
								model: "nova-3",
								language: config.language,
								keyterm: keyterms,
							},
						);

					if (error) {
						throw error;
					}

					return result;
				},
				myRunRetryPolicy,
			);

			const captions = webvtt(result);

			try {
				const captionsKey = `videos/${config.videoId}/captions/en.vtt`;

				const encoder = new TextEncoder();
				const captionsBytes = encoder.encode(captions);

				await r2Client.send(
					new PutObjectCommand({
						Bucket: bucketName,
						Key: captionsKey,
						Body: captionsBytes,
						ContentLength: captionsBytes.byteLength,
						ContentType: "text/vtt",
					}),
				);

				return `Captions uploaded to R2: ${captionsKey}`;
			} catch (error) {
				console.error("Error uploading captions to R2:", error);
				throw new TerminalError("Failed to upload captions to R2", {
					errorCode: 500,
					cause: error,
				});
			}
		},
	},
});

const handler = endpoint()
	.bind(transcriptionService)
	.withIdentityV1(process.env.RESTATE_IDENTITY_KEY || "")
	.bidirectional()
	.handler();

export default {
	fetch: handler,
};
