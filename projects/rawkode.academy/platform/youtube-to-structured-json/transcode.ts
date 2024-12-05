import {
	GetObjectCommand,
	GetObjectCommandInput,
	ListObjectsV2Command,
	PutObjectCommand,
	PutObjectCommandInput,
	S3Client,
} from "@aws-sdk/client-s3";
import { existsSync } from "@std/fs";
import { parse } from "@std/csv";

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

const mimeType = (filename: string) => {
	switch (filename.split(".").pop()) {
		case "mkv":
			return "video/x-matroska";
		case "jpg":
			return "image/jpeg";
		case "json":
			return "application/json";
		case "wav":
			return "audio/wav";
		case "txt":
			return "text/plain";
		default:
			return "application/octet-stream";
	}
};

const downloadFromR2 = async (remote: string, local: string) => {
	if (existsSync(local)) {
		console.log(`File already exists: ${local}`);
		return;
	}

	console.log(`R2 Downloading ${remote} to ${local}...`);

	const command: GetObjectCommandInput = {
		Bucket: "rawkode-academy-videos",
		Key: remote,
	};

	try {
		const s3Command = new GetObjectCommand(command);
		const response = await s3.send(s3Command);
		if (!response.Body) {
			throw new Error("No body in response.");
		}

		Deno.writeFileSync(
			local,
			await response.Body.transformToByteArray(),
		);

		console.log(`File ${remote} downloaded to ${local}.`);
	} catch (error) {
		console.log(`Failed to download: ${error}`);
	}
};

const uploadToR2 = async (local: string, remote: string) => {
	console.log(`R2 Uploading ${local} to ${remote}...`);

	const bytes = Deno.readFileSync(local);
	const uploadCommand: PutObjectCommandInput = {
		Bucket: "rawkode-academy-videos",
		Key: remote,
		Body: bytes,
		ContentLength: bytes.length,
		ContentType: mimeType(remote),
		IfNoneMatch: "*",
	};

	try {
		const s3Command = new PutObjectCommand(uploadCommand);
		await s3.send(s3Command);
		console.log(`File ${local} uploaded to ${remote}.`);
	} catch (error) {
		console.log(`Potentially skipping upload: ${error}`);
	}
};

const listDirectories = async (bucketName: string, prefix: string = "") => {
	const command = new ListObjectsV2Command({
		Bucket: bucketName,
		Delimiter: "/",
		Prefix: prefix,
	});

	try {
		const response = await s3.send(command);
		return {
			directories: response.CommonPrefixes?.map((p) => p.Prefix) || [],
			files: response.Contents?.map((c) => c.Key) || [],
		};
	} catch (error) {
		console.error("Error listing S3 directories:", error);
		throw error;
	}
};

interface Metadata {
	id: string;
	width: number;
	height: number;
}

const getYouTubeMetadata = (metadataJson: string): Metadata => {
	const metadata = JSON.parse(
		Deno.readTextFileSync(metadataJson),
	) satisfies Metadata;

	return {
		id: metadata.id,
		width: metadata.width,
		height: metadata.height,
	};
};

interface Timestamps {
	firstWord: string;
	firstWordTimestamp: string;
	lastWord: string;
	lastWordTimestamp: string;
}

const getTimestamps = (): Record<string, Timestamps> => {
	const csvData = Deno.readTextFileSync("./transcode.csv");
	const rows = parse(csvData);

	const timestamps: Record<string, Timestamps> = {};

	for (const row of rows) {
		const [
			_taskId,
			_status,
			_userId,
			_ipAddress,
			_country,
			_startTime,
			_finishTime,
			_timeTookToCompleteTask,
			videoUrl,
			firstWord,
			firstWordTimestamp,
			lastWord,
			lastWordTimestamp,
		] = row;

		const youtubeId = videoUrl.split("=").pop()!;

		timestamps[youtubeId] = {
			firstWord,
			firstWordTimestamp,
			lastWord,
			lastWordTimestamp,
		};
	}

	return timestamps;
};

interface Resolution {
	width: number;
	height: number;
}

const getResolutions = (width: number, height: number): Resolution[] => {
	const resolutions: Resolution[] = [];

	if (width >= 7680 && height >= 4320) {
		resolutions.push({ width: 7680, height: 4320 });
	}

	if (width >= 3840 && height >= 2160) {
		resolutions.push({ width: 3840, height: 2160 });
	}

	if (width >= 1920 && height >= 1080) {
		resolutions.push({ width: 1920, height: 1080 });
	}

	if (width >= 1280 && height >= 720) {
		resolutions.push({ width: 1280, height: 720 });
	}

	if (width >= 854 && height >= 480) {
		resolutions.push({ width: 854, height: 480 });
	}

	if (width >= 640 && height >= 360) {
		resolutions.push({ width: 640, height: 360 });
	}

	return resolutions;
};

const getFfmpegResolutions = (resolutions: Resolution[]): string => {
	let filter = "";
	for (const resolution of resolutions) {
		filter += `scale=${resolution.width}:${resolution.height},`;
	}

	return filter.substring(0, filter.length - 1);
};

const getVideoBitrate = (width: number, height: number): number => {
	if (width >= 7680 && height >= 4320) {
		return 50000;
	}

	if (width >= 3840 && height >= 2160) {
		return 25000;
	}

	if (width >= 1920 && height >= 1080) {
		return 10000;
	}

	if (width >= 1280 && height >= 720) {
		return 5000;
	}

	if (width >= 854 && height >= 480) {
		return 2500;
	}

	if (width >= 640 && height >= 360) {
		return 1000;
	}

	return 500;
};

const transcodeVideo = (id: string, width: number, height: number, start: string, end: string): boolean => {
	const resolutions = getResolutions(width, height);

	return new Deno.Command("ffmpeg", {
		args: [
			"-i",
			`./transcode/${id}/video.mkv`,
			"-filter_complex",
			getFfmpegResolutions(resolutions),
			"-ss",
			start,
			"-to",
			end,
		].concat(...resolutions.map((r) => [
			"-map",
			`[v:${r.width}x${r.height}]`,
			"-c:v:0",
			"libx264",
			"-b:v:0",
			`${getVideoBitrate(r.width, r.height)}k`,
		])).concat([
			"-map",
			"0:a",
			"-map",
			"0:a",
			"-map",
			"0:a",
			"-c:a",
			"aac",
			"-b:a",
			"128k",
			"-f",
			"hls",
			"-var_stream_map",
			"v:0,a:0 v:1,a:1 v:2,a:2",
			"-master_pl_name",
			"master.m3u8",
			"-hls_time",
			"6",
			"-hls_list_size",
			"0",
			"-hls_segment_filename",
			`stream_%v/data%03d.ts`,
			`stream_%v.m3u8`,
		]),
	}).outputSync().success;
};

// const trimVideo = (id: string, start: string, end: string): boolean => {
// 	if (existsSync(`./transcode/${id}/trimmed.mkv`)) {
// 		console.log(`Trimmed video already exists: ${id}`);
// 		return true;
// 	}

// 	console.log(`Trimming video ${id} from ${start} to ${end}...`);

// 	const response = new Deno.Command("ffmpeg", {
// 		args: [
// 			"-accurate_seek",
// 			"-ss",
// 			start,
// 			"-i",
// 			`./transcode/${id}/video.mkv`,
// 			"-avoid_negative_ts",
// 			"make_zero",
// 			"-to",
// 			end,
// 			"-c",
// 			"copy",
// 			`./transcode/${id}/trimmed.mkv`,
// 		],
// 	}).outputSync();

// 	if (!response.success) {
// 		const stdout = new TextDecoder().decode(response.stdout);
// 		const stderr = new TextDecoder().decode(response.stderr);

// 		Deno.writeTextFileSync(
// 			`./transcode/${id}/failed`,
// 			`stdout: ${stdout}\nstderr: ${stderr}`,
// 		);
// 	}

// 	return response.success;
// };

const allDirectories = await listDirectories("rawkode-academy-videos");

const timestamps = getTimestamps();

for (const directory of allDirectories.directories) {
	if (!directory) {
		console.log(`Skipping directory: ${directory}`);
		continue;
	}
	const dirName = directory.substring(0, directory.length - 1);

	if (existsSync(`transcode/${dirName}/failed`)) {
		console.log(`Skipping failed directory: ${directory}`);
		continue;
	}

	if (!existsSync(`transcode/${dirName}`)) {
		Deno.mkdirSync(`transcode/${dirName}`, { recursive: true });
	}

	// Download Metadata
	await downloadFromR2(
		`${dirName}/youtube/metadata.json`,
		`./transcode/${dirName}/metadata.json`,
	);

	const metadata = getYouTubeMetadata(`./transcode/${dirName}/metadata.json`);

	// Download Original mkv
	await downloadFromR2(
		`${dirName}/youtube/video.mkv`,
		`./transcode/${dirName}/video.mkv`,
	);

	Deno.writeTextFileSync(
		`./transcode/${dirName}/timestamps.json`,
		JSON.stringify(timestamps[metadata.id]),
	);
	await uploadToR2(
		`./transcode/${dirName}/timestamps.json`,
		`${dirName}/timestamps.json`,
	);

	if (
		!transcodeVideo(
			dirName,
			metadata.width,
			metadata.height,
			timestamps[metadata.id].firstWordTimestamp,
			timestamps[metadata.id].lastWordTimestamp,
		)
	) {
		console.log(`Failed to transcode video: ${dirName}`);
		continue;
	}

	break;
}
