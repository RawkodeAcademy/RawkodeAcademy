import {
	PutObjectCommand,
	PutObjectCommandInput,
	S3Client,
} from "@aws-sdk/client-s3";
import { SpeechClient } from "@google-cloud/speech";
import { Storage } from "@google-cloud/storage";
import { createId } from "@paralleldrive/cuid2";
import { existsSync } from "@std/fs";
import { Buffer } from "node:buffer";
import { parseFile} from "music-metadata";

const googleSpeechClient = new SpeechClient();
const googleStorage = new Storage();

const cloudflareR2 = {
	accountId: "0aeb879de8e3cdde5fb3d413025222ce",
	accessKey: Deno.env.get("CLOUDFLARE_R2_ACCESS_KEY")!,
	secretKey: Deno.env.get("CLOUDFLARE_R2_SECRET_KEY")!,
};

const s3 = new S3Client({
	region: "auto",
	endpoint: `https://${cloudflareR2.accountId}.eu.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: cloudflareR2.accessKey,
		secretAccessKey: cloudflareR2.secretKey,
	},
});

const downloadVideo = async (id: string) => {
	if (existsSync(`./pipeline/${id}/video.mkv`)) {
		return;
	}

	console.log("Downloading video...");

	// Download best video and audio streams separately (no merge)
	await new Deno.Command("yt-dlp", {
		args: [
			"-f",
			"bestvideo+bestaudio",
			"--remux-video",
			"mkv",
			"-o",
			`./pipeline/${id}/video.%(ext)s`,
			`https://www.youtube.com/watch?v=${id}`,
		],
	}).outputSync();

	// Download thumbnail
	await new Deno.Command("yt-dlp", {
		args: [
			"--write-thumbnail",
			"--skip-download",
			"--convert-thumbnails",
			"jpg",
			"-o",
			`./pipeline/${id}/thumbnail`,
			`https://www.youtube.com/watch?v=${id}`,
		],
	}).outputSync();

	// Download metadata as JSON
	await new Deno.Command("yt-dlp", {
		args: [
			"--write-info-json",
			"--skip-download",
			"-o",
			`./pipeline/${id}/metadata`,
			`https://www.youtube.com/watch?v=${id}`,
		],
	}).outputSync();

	// Download Description if available
	await new Deno.Command("yt-dlp", {
		args: [
			"--write-description",
			"--skip-download",
			"-o",
			`./pipeline/${id}/description`,
			`https://www.youtube.com/watch?v=${id}`,
		],
	}).outputSync();
};

const getAudioFromVideo = async (id: string) => {
	if (existsSync(`./pipeline/${id}/audio.wav`)) {
		return;
	}

	// Get audio from video file
	console.log("Extracting audio...");
	await new Deno.Command(
		"ffmpeg",
		{
			args: [
				"-i",
				`./pipeline/${id}/video.mkv`,
				"-vn",
				"-acodec",
				"pcm_s16le",
				"-ar",
				"16000",
				"-ac",
				"1",
				`./pipeline/${id}/audio.wav`,
			],
		},
	).outputSync();
};

const transcribeAudio = async (id: string): Promise<boolean> => {
	if (existsSync(`./pipeline/${id}/audio.json`)) {
		return true;
	}

	try {
		console.log("Uploading audio to Google Cloud Storage...");
		await googleStorage.bucket("rawkode-academy-video-pipeline").upload(`./pipeline/${id}/audio.wav`, {
			destination: `${id}/audio.wav`,
		});

		console.log("Done");

		const [operation] = await googleSpeechClient.longRunningRecognize({
			config: {
				enableAutomaticPunctuation: true,
				languageCode: "en-US",
				encoding: "LINEAR16",
				sampleRateHertz: 16000,
				enableSpokenPunctuation: {value: true},
				profanityFilter: false,
				useEnhanced: true,
				model: "video",
				adaptation: {
					phraseSetReferences: [
						"projects/458678766461/locations/global/phraseSets/rawkode-academy"
					]
				}
			},
			audio: {
				uri: `gs://rawkode-academy-video-pipeline/${id}/audio.mka`,
			},
		});

		const [response] = await operation.promise();

		console.debug(response);


		if (!response.results) {
			console.log(`Failed: ${id}`);
			return false;
		}

		response.results.forEach(async (result) => {
			if (!result.alternatives) {
				return false;
			}

			const alternative = result.alternatives[0];

			Deno.writeFileSync(
				`./pipeline/${id}/transcript.json`,
				new TextEncoder().encode(JSON.stringify(alternative)),
			);

			// const uploadCommand: PutObjectCommandInput = {
			// 	Bucket: "rawkode-academy-video",
			// 	Key: `${id}/transcript.json`,
			// 	Body: JSON.stringify(alternative),
			// 	ContentLength: alternative.transcript?.length,
			// 	ContentType: "text/plain",
			// };

			// const s3Command = new PutObjectCommand(uploadCommand);
			// await s3.send(s3Command);
		});
	} catch (error) {
		console.log("Failed to transcribe audio...");
		console.error(error);
		return false;
	}
	return true;

	// console.log("Transcribing audio...");
	// const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
	// 	Buffer.from(Deno.readFileSync(`./pipeline/${id}/audio.mka`)),
	// 	{
	// 		model: "nova-2",
	// 		detect_topics: true,
	// 		detect_entities: true,
	// 		detect_language: true,
	// 		language: "en-US",
	// 		profanity_filter: false,
	// 		punctuate: true,
	// 		summarize: true,
	// 		paragraphs: true,
	// 		keywords: Deno.readFileSync("./glossary.txt").toString().split(
	// 			"\n",
	// 		),
	// 	},
	// );

	// if (error) {
	// 	console.error(error);
	// 	return false;
	// }

	// Deno.writeFileSync(
	// 	`./pipeline/${id}/audio.json`,
	// 	new TextEncoder().encode(JSON.stringify(result)),
	// );

	// const captions = webvtt(result);

	// Deno.writeFileSync(
	// 	`./pipeline/${id}/audio.en.vtt`,
	// 	new TextEncoder().encode(captions),
	// );
};

// const firstLastWords = {
// 	type: SchemaType.OBJECT,
// 	properties: {
// 		firstWordTimestamp: {
// 			type: SchemaType.STRING,
// 			description: "When is the first word said?",
// 		},
// 		lastWordTimestamp: {
// 			type: SchemaType.STRING,
// 			description: "When is the last word said?",
// 		},
// 	},
// };

// const determinateFirstLastWords = async (id: string): Promise<boolean> => {
// 	if (existsSync(`./pipeline/${id}/first-last-words.json`)) {
// 		return true;
// 	}

// 	console.log("Finding first and last words...");

// 	const audio = Deno.readTextFileSync(`./pipeline/${id}/audio.en.vtt`);

// 	const model = genAI.getGenerativeModel({
// 		model: "gemini-1.5-flash-latest",
// 		generationConfig: {
// 			responseMimeType: "application/json",
// 			responseSchema: firstLastWords,
// 		},
// 	});

// 	try {
// 		const result = await model.generateContent(
// 			[
// 				`Here are subtitles for a video.

// 				We need the exact timestamp for the first spoken word and the last spoken word.

// 				To ensure we trim the video correctly, give a 300ms buffer on either side.

// 				Subtitles: ${audio}`,
// 			],
// 			{
// 				timeout: 180000,
// 			},
// 		);

// 		Deno.writeTextFileSync(
// 			`./pipeline/${id}/first-last-words.json`,
// 			result.response.text(),
// 		);
// 	} catch (error) {
// 		console.error(error);
// 		return false;
// 	}

// 	return true;
// };

const trimVideo = async (id: string) => {
	if (existsSync(`./pipeline/${id}/video-trim.mkv`)) {
		return;
	}

	const json = JSON.parse(
		await Deno.readTextFile(`./pipeline/${id}/first-last-words.json`),
	);

	const start = json.firstWordTimestamp;
	const end = json.lastWordTimestamp;

	console.log("Trimming video...");

	await new Deno.Command(
		"ffmpeg",
		{
			args: [
				"-i",
				`./pipeline/${id}/video.mkv`,
				"-ss",
				start,
				"-to",
				end,
				"-c",
				"copy",
				`./pipeline/${id}/video-trim.mkv`,
			],
		},
	).outputSync();
};

// loop over every json file in ./data-from-csv
for (const file of Deno.readDirSync("./data-from-csv")) {
	if (!file.name.endsWith(".json")) {
		continue;
	}

	const json = JSON.parse(
		await Deno.readTextFile(`./data-from-csv/${file.name}`),
	);

	if (json["Video ID"] !== "7J_j42jddDg") {
		continue;
	}

	if (existsSync(`./data-from-csv/${json["Video ID"]}.done`)) {
		console.log(`Skipping ${file.name} as it's been processed...`);
		continue;
	}

	const videoId = json["Video ID"];

	console.log(`Processing ${videoId}...`);

	Deno.mkdirSync(`./pipeline/${videoId}`, { recursive: true });

	await downloadVideo(videoId);

	await getAudioFromVideo(videoId);

	await transcribeAudio(videoId);

	// await trimVideo(videoId);

	Deno.writeFileSync(
		`./data-from-csv/${json["Video ID"]}.done`,
		new TextEncoder().encode(""),
	);
}
